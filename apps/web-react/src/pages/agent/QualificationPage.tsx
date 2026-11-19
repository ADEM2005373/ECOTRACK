import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Bell,
  Hourglass,
  Check,
  Edit3,
  XCircle,
  Lock,
  Unlock,
  X,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AnomalyCard, AnomalyReportData } from '../../components/moderation/AnomalyCard';
import { FigmaSidebar } from '../../components/layout/FigmaSidebar';

// Available categories for Agent Override
const CATEGORY_OPTIONS = [
  { value: 'DEPOT_SAUVAGE', label: 'Dépôt sauvage' },
  { value: 'ENCOMBRANTS', label: 'Objets encombrants' },
  { value: 'DECHETS_DANGEREUX', label: 'Déchets dangereux' },
  { value: 'GRAFFITI', label: 'Dégradation & Graffiti' },
  { value: 'VEGETAUX', label: 'Déchets végétaux' },
  { value: 'AUTRE', label: 'Autre anomalie' },
];

const SEVERITY_OPTIONS = [
  { value: 'FAIBLE', label: 'Faible' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'ELEVEE', label: 'Élevée' },
];

const REJECTION_REASONS = [
  'Photo floue / Inexploitable',
  'Hors périmètre municipal (hors 9 arr.)',
  'Doublon déjà pris en charge',
  'Signalement abusif / Non écologique',
  'Autre motif',
];

interface QueueItem {
  report: AnomalyReportData;
  aiSuggestion: {
    categoryCode: string;
    categoryLabel: string;
    confidenceScore: number; // e.g. 92
    severity: string; // "Élevée"
    justification: string;
  };
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    report: {
      id: '672f10a8b9e1a2001c45a789',
      reference: 'ECO-2026-0842',
      title: 'Dépôt sur le trottoir, passage réduit',
      description:
        '« Des sacs, des cartons et une chaise ont été déposés contre le mur. Le passage est difficile pour les poussettes. »',
      photoUrl: '/assets/signalement-trottoir.png',
      photoDate: '02/11/2026, 09:40',
      location: {
        address: '18 Avenue Habib Bourguiba · Tunis Centre',
        coordinates: [36.8008, 10.1865],
        district: 'Centre-Ville',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Aucun doublon détecté',
      hasDuplicate: false,
      receivedAt: '2 novembre 2026 à 09:42',
      status: 'NOUVEAU',
    },
    aiSuggestion: {
      categoryCode: 'DEPOT_SAUVAGE',
      categoryLabel: 'Dépôt sauvage',
      confidenceScore: 92,
      severity: 'Élevée',
      justification:
        'Sacs et objets encombrants identifiés sur l’espace public. Risque d’obstruction du cheminement piéton.',
    },
  },
  {
    report: {
      id: '672f10a8b9e1a2001c45a790',
      reference: 'ECO-2026-0843',
      title: 'Matelas et sommier abandonnés',
      description:
        '« Un vieux matelas deux places et un sommier posés à côté des bacs de recyclage depuis hier soir. »',
      photoUrl: '/assets/signalement-trottoir.png',
      photoDate: '02/11/2026, 09:48',
      location: {
        address: '45 Avenue de la Liberté · Tunis Belvédère',
        coordinates: [36.8189, 10.1786],
        district: 'Belvédère',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Aucun doublon détecté',
      hasDuplicate: false,
      receivedAt: '2 novembre 2026 à 09:50',
      status: 'NOUVEAU',
    },
    aiSuggestion: {
      categoryCode: 'ENCOMBRANTS',
      categoryLabel: 'Objets encombrants',
      confidenceScore: 74,
      severity: 'Moyenne',
      justification:
        'Mobilier volumineux détecté à proximité de conteneurs de collecte sélective.',
    },
  },
  {
    report: {
      id: '672f10a8b9e1a2001c45a791',
      reference: 'ECO-2026-0844',
      title: 'Bidons suspect près du parc',
      description:
        '« Plusieurs bidons métalliques avec des étiquettes avertissement déversés dans le fossé. »',
      photoUrl: '/assets/signalement-trottoir.png',
      photoDate: '02/11/2026, 10:02',
      location: {
        address: 'Route du Lac · Les Berges du Lac',
        coordinates: [36.8335, 10.2312],
        district: 'Berges du Lac',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Doublon potentiel (#0839)',
      hasDuplicate: true,
      receivedAt: '2 novembre 2026 à 10:05',
      status: 'NOUVEAU',
    },
    aiSuggestion: {
      categoryCode: 'DECHETS_DANGEREUX',
      categoryLabel: 'Déchets dangereux',
      confidenceScore: 48,
      severity: 'Élevée',
      justification:
        'Conteneurs industriels ou produits chimiques potentiellement toxiques nécessitant intervention spécialisée.',
    },
  },
];

export const QualificationPage: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(100);
  const [isMaximizeOpen, setIsMaximizeOpen] = useState(false);

  // Override Category State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ELEVEE');
  const [isOverridden, setIsOverridden] = useState(false);

  // Rejection State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentItem = queue[currentIndex] || queue[0];
  const { report, aiSuggestion } = currentItem;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 20, 80));

  // Confidence Badge & Gauge calculation
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: `Confiance Élevée : ${score} %`,
        textColor: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/20 border-emerald-500/30',
        gaugeBg: 'bg-emerald-600',
      };
    } else if (score >= 60) {
      return {
        label: `À vérifier : ${score} %`,
        textColor: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-500/20 border-amber-500/30',
        gaugeBg: 'bg-amber-600',
      };
    } else {
      return {
        label: `Confiance Faible : ${score} %`,
        textColor: 'text-rose-700 dark:text-rose-400',
        bgColor: 'bg-rose-500/20 border-rose-500/30',
        gaugeBg: 'bg-rose-600',
      };
    }
  };

  const confidenceBadge = getConfidenceBadge(aiSuggestion.confidenceScore);

  // Active Category to display
  const activeCategory = isOverridden
    ? CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label || selectedCategory
    : aiSuggestion.categoryLabel;

  const activeSeverity = isOverridden
    ? SEVERITY_OPTIONS.find((s) => s.value === selectedSeverity)?.label || selectedSeverity
    : aiSuggestion.severity;

  // Decision 1: Valider la suggestion IA (T1)
  const handleValidate = () => {
    const payload = {
      reportId: report.id,
      action: 'VALIDATE',
      confirmedCategory: isOverridden ? selectedCategory : aiSuggestion.categoryCode,
      aiOverridden: isOverridden,
      agentId: '672f08a0b9e1a2001c45a001',
    };

    console.info('[ECO-31] Validation T1 transmise:', payload);

    try {
      const token = localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T1',
          actorRole: 'AGENT_MAIRIE',
          categoryValidated: isOverridden ? selectedCategory : aiSuggestion.categoryCode,
          reviewValidated: true
        })
      }).catch(() => {});
    } catch {
      // ignore
    }

    setQueue((prevQueue) =>
      prevQueue.map((item, idx) =>
        idx === currentIndex
          ? {
              ...item,
              report: { ...item.report, status: 'VALIDE' },
            }
          : item
      )
    );

    showToast(`Signalement ${report.reference} validé avec succès (T1) !`);
  };

  // Decision 2: Confirmer la correction manuelle de la catégorie
  const handleConfirmOverride = () => {
    setIsOverridden(true);
    setIsOverrideModalOpen(false);
    showToast(`Catégorie modifiée : ${activeCategory}`);
  };

  // Decision 3: Rejeter le signalement (T5)
  const handleConfirmReject = () => {
    const payload = {
      reportId: report.id,
      action: 'REJECT',
      transition: 'T5_REJECT',
      reason: rejectReason,
      note: customRejectNote,
      agentId: '672f08a0b9e1a2001c45a001',
    };

    console.info('[ECO-31] Rejet T5 transmis:', payload);

    try {
      const token = localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T5',
          actorRole: 'AGENT_MAIRIE',
          reason: customRejectNote ? `${rejectReason} — Note: ${customRejectNote}` : rejectReason
        })
      }).catch(() => {});
    } catch {
      // ignore
    }

    setQueue((prevQueue) =>
      prevQueue.map((item, idx) =>
        idx === currentIndex
          ? {
              ...item,
              report: { ...item.report, status: 'REJETE' },
            }
          : item
      )
    );

    setIsRejectModalOpen(false);
    showToast(`Signalement ${report.reference} rejeté (T5). Motif : ${rejectReason}`);
  };

  // Queue navigation
  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsOverridden(false);
      setZoomScale(100);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsOverridden(false);
      setZoomScale(100);
    }
  };

  const isCurrentValidated = report.status === 'VALIDE';
  const isCurrentRejected = report.status === 'REJETE';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 font-sans">
      {/* ===================== SIDEBAR (Figma: 05_Flow_Agent_Web) ===================== */}
      <FigmaSidebar currentTab="qualification" />

      {/* ===================== WORKSPACE (MAIN CONTENT) ===================== */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar (Figma: Barre supérieure) */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-600 transition-colors">
              Opérations
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/supervision" className="hover:text-emerald-600 transition-colors">
              Signalements
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Qualification Split-Screen
            </span>
          </div>

          {/* Outils & Notifs */}
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-medium">
              Lundi 2 novembre 2026
            </span>
            <div className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>
        </header>

        {/* Sub-header: Title, Queue Navigator & Status Badge */}
        <div className="px-4 sm:px-8 py-3.5 bg-white dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-heading tracking-tight">
                Qualification du signalement
              </h1>
              {/* Badge Statut */}
              {isCurrentValidated ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validé
                </span>
              ) : isCurrentRejected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeté
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5" />
                  À traiter
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Boîte de réception / <span className="font-mono font-medium">{report.reference}</span> · Reçu le {report.receivedAt}
            </p>
          </div>

          {/* Queue Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">
              File : <strong>{currentIndex + 1}</strong> sur <strong>{queue.length}</strong>
            </span>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Signalement précédent"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === queue.length - 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Signalement suivant"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-4 sm:mx-8 mt-3 p-3 bg-emerald-600 text-white rounded-lg shadow-lg text-xs font-medium flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button type="button" onClick={() => setToastMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ===================== SPLIT-SCREEN WORKSPACE ===================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANNEAU GAUCHE: Preuves & Contexte (cols 1-7 sur large) */}
            <section className="lg:col-span-7 w-full">
              <AnomalyCard
                report={report}
                zoomScale={zoomScale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onMaximize={() => setIsMaximizeOpen(true)}
              />
            </section>

            {/* PANNEAU DROIT: Qualification Humaine & Suggestion IA (cols 8-12) */}
            <section className="lg:col-span-5 w-full flex flex-col gap-4">
              {/* Carte Suggestion IA (Figma: Suggestion de l’IA) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                      Suggestion de l’IA
                    </h2>
                    {isOverridden && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        Corrigé par l’agent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Analyse indicative · La décision finale vous appartient.
                  </p>
                </div>

                {/* Score & Badge dynamique */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Confiance du modèle
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {aiSuggestion.confidenceScore} %
                    </span>
                  </div>

                  {/* Badge de couleur explicite (Exigence CDCF / Jira) */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${confidenceBadge.bgColor} ${confidenceBadge.textColor} mb-2.5`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{confidenceBadge.label}</span>
                  </div>

                  {/* Jauge visuelle de confiance */}
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${confidenceBadge.gaugeBg}`}
                      style={{ width: `${aiSuggestion.confidenceScore}%` }}
                    />
                  </div>
                </div>

                {/* Résultat IA (Catégorie & Sévérité) */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Catégorie {isOverridden ? 'Confirmée' : 'Suggérée'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white mt-1 block">
                      {activeCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Sévérité
                    </span>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 mt-1 block">
                      {activeSeverity}
                    </span>
                  </div>
                </div>

                {/* Justification textuelle de l'IA */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/20 p-2.5 rounded border border-slate-100 dark:border-slate-800">
                  {aiSuggestion.justification}
                </p>

                {/* Repères des seuils de confiance */}
                <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    <span>≥ 80 % (Élevée)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <span>60–79 % (À vérifier)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-rose-500" />
                    <span>&lt; 60 % (Faible)</span>
                  </div>
                </div>
              </div>

              {/* Boutons d'Action / Décision d'arbitrage (Figma: Décision) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Bouton Vert: Valider */}
                  <button
                    type="button"
                    onClick={handleValidate}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all duration-150"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider la détection</span>
                  </button>

                  {/* Bouton Bleu: Corriger (Override) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(aiSuggestion.categoryCode);
                      setIsOverrideModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-white dark:bg-slate-800 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold text-xs transition-all duration-150"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>

                  {/* Bouton Rouge: Rejeter */}
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all duration-150"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeter l'anomalie</span>
                  </button>
                </div>

                {/* Bouton Dispatch (Affectation) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  {isCurrentValidated ? (
                    <Link
                      to="/supervision"
                      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-sapphire-900 hover:bg-sapphire-800 text-white font-semibold text-xs shadow-md shadow-sapphire-900/30 transition-all"
                    >
                      <Unlock className="w-4 h-4 text-emerald-400" />
                      <span>Affecter à une brigade</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 font-medium text-xs border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-80"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Valider pour affecter</span>
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    L’affectation est verrouillée tant que la catégorie et la sévérité n’ont pas été validées par un agent.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ===================== MODALE 1 : PLEIN ÉCRAN IMAGE ===================== */}
      {isMaximizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-white text-xs font-mono">{report.reference}</span>
            <button
              type="button"
              onClick={() => setIsMaximizeOpen(false)}
              className="p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={report.photoUrl}
            alt={report.title}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      {/* ===================== MODALE 2 : CORRECTION CATÉGORIE ===================== */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Modifier la catégorie
              </h3>
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nouvelle Catégorie :
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Niveau de Sévérité :
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODALE 3 : REJET DU SIGNALEMENT (T5) ===================== */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold font-heading">Rejeter le signalement</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Veuillez sélectionner le motif officiel de rejet pour archiver ce signalement et en informer le citoyen :
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Motif de rejet :
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Remarque complémentaire (facultatif) :
                </label>
                <textarea
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Explication complémentaire transmise dans le journal d'audit..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationPage;
