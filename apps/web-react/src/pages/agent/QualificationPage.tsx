import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Bell,
  Hourglass,
  Check,
  Edit3,
  XCircle,
  Lock,
  X,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Send
} from 'lucide-react';
import { AnomalyCard, AnomalyReportData } from '../../components/moderation/AnomalyCard';
import { FigmaSidebar } from '../../components/layout/FigmaSidebar';
import { useAuth } from '../../store/authStore';

// Table des correspondances catégories pour la révision manuelle
const CATEGORY_OPTIONS = [
  { value: 'DEPOT_SAUVAGE', label: 'Dépôt sauvage' },
  { value: 'ENCOMBRANTS', label: 'Objets encombrants' },
  { value: 'DECHETS_DANGEREUX', label: 'Déchets dangereux' },
  { value: 'GRAFFITI', label: 'Dégradation & Graffiti' },
  { value: 'VEGETAUX', label: 'Déchets végétaux' },
  { value: 'DEBORDEMENT_BAC', label: 'Bacs débordants' },
  { value: 'AUTRE', label: 'Autre anomalie' },
];

const SEVERITY_OPTIONS = [
  { value: 'FAIBLE', label: 'Faible' },
  { value: 'MOYENNE', label: 'Moyenne' },
  { value: 'ELEVEE', label: 'Élevée' },
];

const REJECTION_REASONS = [
  'Photo floue / Inexploitable',
  'Hors périmètre municipal (hors compétence)',
  'Doublon déjà pris en charge',
  'Signalement abusif / Non écologique',
  'Domaine privé non assujetti au domaine public',
  'Autre motif réglementaire',
];

// Table d'auto-routing vers les brigades spécialisées
const CATEGORY_BRIGADE_ROUTING: Record<string, string> = {
  DEPOT_SAUVAGE: 'Brigade Voirie & Salubrité',
  DECHARGE_SAUVAGE: 'Brigade Voirie & Salubrité',
  ENCOMBRANTS: 'Brigade Ramassage Poids Lourd',
  VEGETAUX: 'Brigade Espaces Verts',
  GRAFFITI: 'Brigade Peinture & Nettoyage',
  DECHETS_DANGEREUX: 'Brigade Intervention Spéciale',
  DEBORDEMENT_BAC: 'Brigade Collecte Express',
  AUTRE: 'Brigade Voirie & Salubrité'
};

interface QueueItem {
  report: AnomalyReportData;
  aiSuggestion: {
    categoryCode: string;
    categoryLabel: string;
    confidenceScore: number;
    severity: string;
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
      photoUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      photoDate: '19/11/2026, 09:40',
      location: {
        address: '18 Avenue Habib Bourguiba · Zarzouna Centre',
        coordinates: [37.2667, 9.8667],
        district: 'Centre-Ville',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Aucun doublon détecté',
      hasDuplicate: false,
      receivedAt: '19 novembre 2026 à 09:42',
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
      photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
      photoDate: '19/11/2026, 09:48',
      location: {
        address: '45 Rue de la République · Zarzouna Sud',
        coordinates: [37.2680, 9.8710],
        district: 'Zarzouna Sud',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Aucun doublon détecté',
      hasDuplicate: false,
      receivedAt: '19 novembre 2026 à 09:50',
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
      title: 'Bidons suspects près du canal',
      description:
        '« Plusieurs bidons métalliques avec des étiquettes avertissement déversés sur le bas-côté. »',
      photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      photoDate: '19/11/2026, 10:02',
      location: {
        address: 'Route du Port · Zone Portuaire',
        coordinates: [37.2620, 9.8630],
        district: 'Zone Portuaire',
      },
      source: 'Application citoyenne',
      duplicatesText: 'Doublon potentiel (#0839)',
      hasDuplicate: true,
      receivedAt: '19 novembre 2026 à 10:05',
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
  const { state: authState } = useAuth();
  const municipality = authState.user?.municipality || 'Mairie de Zarzouna';

  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(100);
  const [isMaximizeOpen, setIsMaximizeOpen] = useState(false);
  const [communalStaff, setCommunalStaff] = useState<Array<{ id: string; fullName: string; role: string }>>([]);

  // Modale de modification de catégorie (Override)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ELEVEE');
  const [isOverridden, setIsOverridden] = useState(false);

  // Modale de rejet motivé (T5)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECTION_REASONS[0]);
  const [customRejectNote, setCustomRejectNote] = useState('');

  // Modale d'affectation à une brigade technique (T2)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetBrigade, setTargetBrigade] = useState('Brigade Voirie & Salubrité');
  const [targetWorker, setTargetWorker] = useState('');
  const [targetPriority, setTargetPriority] = useState('HAUTE');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentItem = queue[currentIndex] || queue[0] || INITIAL_QUEUE[0];
  const { report, aiSuggestion } = currentItem;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Chargement des données réelles depuis MongoDB
  const fetchLiveReports = async () => {
    try {
      const res = await fetch('/api/v1/reports');
      if (res.ok) {
        const raw = await res.json();
        const list: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.reports)
          ? raw.reports
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        if (list.length > 0) {
          const liveQueue: QueueItem[] = list.map((r: any, idx: number) => {
            const rawCat = r.categoryValidated || r.category || 'DEPOT_SAUVAGE';
            const catLabel = CATEGORY_OPTIONS.find(c => c.value === rawCat)?.label || rawCat;
            const conf = typeof r.aiConfidenceScore === 'number'
              ? Math.round(r.aiConfidenceScore > 1 ? r.aiConfidenceScore : r.aiConfidenceScore * 100)
              : 92;

            return {
              report: {
                id: String(r.id || r._id || `live_${idx}`),
                reference: r.reference || `REP-2026-${String(idx + 1).padStart(4, '0')}`,
                title: r.description || r.title || 'Anomalie signalée sur voie publique',
                description: r.description || 'Signalement citoyen enregistré',
                photoUrl: r.imageUrl || r.thumbnailUrl || 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
                photoDate: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Aujourd’hui',
                location: {
                  address: `${r.district || 'Centre-Ville'} · ${municipality}`,
                  coordinates: [r.location?.coordinates?.[1] || 37.2667, r.location?.coordinates?.[0] || 9.8667],
                  district: r.district || 'Centre-Ville',
                },
                source: 'Application citoyenne EcoTrack',
                duplicatesText: r.isDuplicate ? `Doublon de ${r.duplicateOf}` : 'Aucun doublon détecté',
                hasDuplicate: !!r.isDuplicate,
                receivedAt: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Aujourd’hui',
                status: r.status || 'NOUVEAU',
              },
              aiSuggestion: {
                categoryCode: rawCat,
                categoryLabel: catLabel,
                confidenceScore: conf,
                severity: r.priority || 'Élevée',
                justification: `Détection automatique validée par l'IA Vision pour le périmètre de ${municipality}.`,
              }
            };
          });

          setQueue(liveQueue);
          setCurrentIndex(0);
        }
      }
    } catch {
      // Garder INITIAL_QUEUE
    }
  };

  // Chargement des effectifs communaux réels
  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/v1/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          const list = data.users
            .filter((u: any) =>
              (u.role === 'CHEF_OUVRIER' || u.role === 'OUVRIER') &&
              (!u.municipality || u.municipality === municipality || municipality.includes(u.municipality) || u.municipality.includes(municipality))
            )
            .map((u: any) => ({
              id: u.id,
              fullName: u.fullName,
              role: u.role
            }));
          setCommunalStaff(list);
          if (list.length > 0) {
            setTargetWorker(list[0].fullName);
          }
        }
      }
    } catch {
      // Ignorer
    }
  };

  useEffect(() => {
    void fetchLiveReports();
    void fetchStaff();
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 20, 80));

  // Badge de confiance IA (Exigence CDCF V2)
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) {
      return {
        label: `Confiance Élevée : ${score} %`,
        textColor: 'text-[#059669]',
        bgColor: 'bg-[#ecfdf5] border-[#a7f3d0]',
        gaugeBg: 'bg-[#059669]',
      };
    } else if (score >= 60) {
      return {
        label: `À vérifier : ${score} %`,
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50 border-amber-200',
        gaugeBg: 'bg-amber-500',
      };
    } else {
      return {
        label: `Confiance Faible : ${score} %`,
        textColor: 'text-rose-700',
        bgColor: 'bg-rose-50 border-rose-200',
        gaugeBg: 'bg-rose-600',
      };
    }
  };

  const confidenceBadge = getConfidenceBadge(aiSuggestion.confidenceScore);

  const activeCategory = isOverridden
    ? CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label || selectedCategory
    : aiSuggestion.categoryLabel;

  const activeSeverity = isOverridden
    ? SEVERITY_OPTIONS.find((s) => s.value === selectedSeverity)?.label || selectedSeverity
    : aiSuggestion.severity;

  // Décision 1 : Valider la suggestion IA (T1)
  const handleValidate = async () => {
    const payload = {
      reportId: report.id,
      action: 'VALIDATE',
      confirmedCategory: isOverridden ? selectedCategory : aiSuggestion.categoryCode,
      aiOverridden: isOverridden,
      agentId: authState.user?.id || '672f08a0b9e1a2001c45a001',
    };

    console.info('[ECO-31] Validation T1 transmise:', payload);

    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T1',
          actorRole: authState.user?.role || 'AGENT_MAIRIE',
          actorId: authState.user?.email || authState.user?.id,
          categoryValidated: isOverridden ? selectedCategory : aiSuggestion.categoryCode,
          reviewValidated: true
        })
      }).catch(() => {});
    } catch {
      // Ignorer
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

    // Préparation de l'affectation automatique
    const code = isOverridden ? selectedCategory : aiSuggestion.categoryCode;
    const autoBrigade = CATEGORY_BRIGADE_ROUTING[code] || 'Brigade Voirie & Salubrité';
    setTargetBrigade(autoBrigade);

    showToast(`Signalement ${report.reference} validé avec succès (T1) !`);
  };

  // Décision 2 : Confirmer la correction manuelle de la catégorie
  const handleConfirmOverride = () => {
    setIsOverridden(true);
    setIsOverrideModalOpen(false);
    showToast(`Catégorie modifiée : ${activeCategory}`);
  };

  // Décision 3 : Rejeter le signalement (T5)
  const handleConfirmReject = async () => {
    const payload = {
      reportId: report.id,
      action: 'REJECT',
      transition: 'T5_REJECT',
      reason: rejectReason,
      note: customRejectNote,
      agentId: authState.user?.id || '672f08a0b9e1a2001c45a001',
    };

    console.info('[ECO-31] Rejet T5 transmis:', payload);

    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T5',
          actorRole: authState.user?.role || 'AGENT_MAIRIE',
          actorId: authState.user?.email || authState.user?.id,
          reason: customRejectNote ? `${rejectReason} — Note: ${customRejectNote}` : rejectReason
        })
      }).catch(() => {});
    } catch {
      // Ignorer
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

  // Décision 4 : Ouvrir la modale d'affectation à une brigade
  const handleOpenAssignModal = () => {
    const code = isOverridden ? selectedCategory : aiSuggestion.categoryCode;
    setTargetBrigade(CATEGORY_BRIGADE_ROUTING[code] || 'Brigade Voirie & Salubrité');
    if (communalStaff.length > 0 && !targetWorker) {
      setTargetWorker(communalStaff[0].fullName);
    } else if (!targetWorker) {
      setTargetWorker('Karim Ben Salem (Chef Brigade)');
    }
    setIsAssignModalOpen(true);
  };

  // Décision 5 : Confirmer l'affectation à la brigade (T2)
  const handleConfirmAssign = async () => {
    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T2',
          actorRole: authState.user?.role || 'AGENT_MAIRIE',
          actorId: authState.user?.email || authState.user?.id || 'adel@zarzouna.com',
          teamId: targetBrigade,
          assigneeId: targetWorker || 'Chef de Brigade',
          priority: targetPriority,
          reviewValidated: true,
          categoryValidated: isOverridden ? selectedCategory : aiSuggestion.categoryCode
        })
      });

      setQueue((prevQueue) =>
        prevQueue.map((item, idx) =>
          idx === currentIndex
            ? {
                ...item,
                report: { ...item.report, status: 'ASSIGNE' },
              }
            : item
        )
      );

      setIsAssignModalOpen(false);
      showToast(`Signalement ${report.reference} dispatché avec succès à ${targetBrigade} (${targetWorker}) !`);
    } catch {
      setIsAssignModalOpen(false);
      showToast(`Signalement ${report.reference} dispatché à ${targetBrigade}`);
    }
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

  const isCurrentValidated = report.status === 'VALIDE' || report.status === 'ASSIGNE';
  const isCurrentRejected = report.status === 'REJETE';

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const todayCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* ── SIDEBAR CONSOLE V2 (Figma: 05_Flow_Agent_Web) ────────────────────── */}
      <FigmaSidebar currentTab="qualification" />

      {/* ── WORKSPACE SPLIT-SCREEN LIGHT THEME ──────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white border-b border-[#e2e8f0] flex items-center justify-between shrink-0 shadow-sm">
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748b]">
            <Link to="/" className="hover:text-[#059669] transition-colors font-medium">
              {municipality}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
            <Link to="/" className="hover:text-[#059669] transition-colors font-medium">
              Opérations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span className="font-semibold text-[#0f172a]">
              Qualification Split-Screen
            </span>
          </div>

          {/* Outils & Date dynamique */}
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-[#64748b] font-medium">
              {todayCapitalized}
            </span>
            <div className="relative p-2 rounded-lg hover:bg-slate-100 text-[#475569] cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#059669] ring-2 ring-white" />
            </div>
          </div>
        </header>

        {/* Sub-header: Titre, Navigateur de File & Badge Statut */}
        <div className="px-4 sm:px-8 py-3.5 bg-white border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0f172a] font-heading tracking-tight">
                Qualification du signalement
              </h1>
              {/* Badge Statut */}
              {isCurrentValidated ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validé
                </span>
              ) : isCurrentRejected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeté
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5" />
                  À traiter
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Boîte de réception / <span className="font-mono font-medium text-[#1e3a8a]">{report.reference}</span> · Reçu le {report.receivedAt}
            </p>
          </div>

          {/* Queue Navigation & Actualisation */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748b] mr-1">
              File : <strong>{currentIndex + 1}</strong> sur <strong>{queue.length}</strong>
            </span>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Signalement précédent"
            >
              <ArrowLeft className="w-4 h-4 text-[#475569]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === queue.length - 1}
              className="p-1.5 rounded-lg border border-[#e2e8f0] hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Signalement suivant"
            >
              <ArrowRight className="w-4 h-4 text-[#475569]" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-4 sm:mx-8 mt-3 p-3 bg-[#059669] text-white rounded-lg shadow-lg text-xs font-medium flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button type="button" onClick={() => setToastMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── WORKSPACE SPLIT-SCREEN EN 2 COLONNES (FIGMA) ────────────────────────── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANNEAU GAUCHE : Preuves & Contexte */}
            <section className="lg:col-span-7 w-full">
              <AnomalyCard
                report={report}
                zoomScale={zoomScale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onMaximize={() => setIsMaximizeOpen(true)}
              />
            </section>

            {/* PANNEAU DROIT : Qualification Humaine & Suggestion IA */}
            <section className="lg:col-span-5 w-full flex flex-col gap-4">
              {/* Carte Suggestion IA (Figma: Suggestion de l’IA) */}
              <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-5 shadow-sm space-y-4">
                <div className="border-b border-[#e2e8f0] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0f172a] font-heading">
                      Suggestion de l’IA
                    </h2>
                    {isOverridden && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                        Corrigé par l’agent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">
                    Analyse indicative · La décision finale vous appartient.
                  </p>
                </div>

                {/* Score & Badge dynamique */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#64748b]">
                      Confiance du modèle
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[#059669]">
                      {aiSuggestion.confidenceScore} %
                    </span>
                  </div>

                  {/* Badge de couleur explicite */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${confidenceBadge.bgColor} ${confidenceBadge.textColor} mb-2.5`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{confidenceBadge.label}</span>
                  </div>

                  {/* Jauge visuelle de confiance */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${confidenceBadge.gaugeBg}`}
                      style={{ width: `${aiSuggestion.confidenceScore}%` }}
                    />
                  </div>
                </div>

                {/* Résultat IA (Catégorie & Sévérité) */}
                <div className="grid grid-cols-2 gap-4 bg-[#f8fafc] p-3.5 rounded-lg border border-[#e2e8f0] text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] block">
                      Catégorie {isOverridden ? 'Confirmée' : 'Suggérée'}
                    </span>
                    <span className="text-sm font-semibold text-[#0f172a] mt-1 block">
                      {activeCategory}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] block">
                      Sévérité
                    </span>
                    <span className="text-sm font-semibold text-amber-600 mt-1 block">
                      {activeSeverity}
                    </span>
                  </div>
                </div>

                {/* Justification textuelle de l'IA */}
                <p className="text-xs text-[#475569] leading-relaxed bg-[#f8fafc] p-3 rounded border border-[#e2e8f0]">
                  {aiSuggestion.justification}
                </p>

                {/* Repères des seuils de confiance */}
                <div className="flex items-center gap-4 text-[10px] text-[#94a3b8] pt-1">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#059669]" />
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

              {/* Boutons d'Action / Décision d'arbitrage */}
              <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-5 shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Bouton Vert : Valider */}
                  <button
                    type="button"
                    onClick={handleValidate}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all duration-150"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider la détection</span>
                  </button>

                  {/* Bouton Bleu : Corriger */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(aiSuggestion.categoryCode);
                      setIsOverrideModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs transition-all duration-150"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>

                  {/* Bouton Rouge : Rejeter */}
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all duration-150"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeter l'anomalie</span>
                  </button>
                </div>

                {/* Bouton Dispatch (Affectation déverrouillée) */}
                <div className="pt-2 border-t border-[#e2e8f0]">
                  {isCurrentValidated ? (
                    <button
                      type="button"
                      onClick={handleOpenAssignModal}
                      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Affecter à une brigade</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200 cursor-not-allowed opacity-80"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Valider pour affecter</span>
                    </button>
                  )}
                  <p className="text-[11px] text-[#64748b] text-center mt-2">
                    L’affectation est déverrouillée dès validation de la catégorie par l’agent.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ── MODALE 1 : PLEIN ÉCRAN IMAGE ─────────────────────────────────────── */}
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

      {/* ── MODALE 2 : CORRECTION CATÉGORIE (OVERRIDE) ────────────────────────── */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-base font-bold text-[#0f172a] font-heading">
                Modifier la catégorie
              </h3>
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0f172a] font-semibold mb-1">
                  Nouvelle Catégorie :
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0f172a] font-semibold mb-1">
                  Niveau de Sévérité :
                </label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#475569] hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmOverride}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563eb] hover:bg-blue-700 text-white shadow"
              >
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE 3 : REJET DU SIGNALEMENT (T5) ─────────────────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#dc2626] border-b border-[#e2e8f0] pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold font-heading">Rejeter le signalement</h3>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Veuillez sélectionner le motif officiel de rejet pour archiver ce signalement et en informer le citoyen :
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0f172a] font-semibold mb-1">
                  Motif de rejet :
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a]"
                >
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0f172a] font-semibold mb-1">
                  Remarque complémentaire (facultatif) :
                </label>
                <textarea
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  rows={3}
                  placeholder="Explication complémentaire transmise dans le journal d'audit..."
                  className="w-full p-2.5 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#475569] hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALE 4 : AFFECTATION À UNE BRIGADE TECHNIQUE (T2) ────────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Affectation à une Brigade Technique</h3>
                <p className="text-xs text-[#64748b]">Dossier : <strong className="font-mono text-[#1e3a8a]">{report.reference}</strong></p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a] text-lg font-bold">✕</button>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs space-y-1">
              <p><strong>Anomalie :</strong> {report.title}</p>
              <p><strong>Catégorie confirmée :</strong> <span className="font-mono text-purple-700 font-semibold">{activeCategory}</span></p>
              <p className="text-[11px] text-blue-700 pt-1">
                <strong>Règle d'affectation :</strong> Les anomalies de type <em>{activeCategory}</em> sont prises en charge par la <strong>{targetBrigade}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Brigade Spécialisée Cible</label>
              <select
                value={targetBrigade}
                onChange={e => setTargetBrigade(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
              >
                <option value="Brigade Voirie & Salubrité">Brigade Voirie &amp; Salubrité (Dépôts sauvages, gravats)</option>
                <option value="Brigade Ramassage Poids Lourd">Brigade Ramassage Poids Lourd (Encombrants, mobilier)</option>
                <option value="Brigade Espaces Verts">Brigade Espaces Verts (Déchets végétaux, branchages)</option>
                <option value="Brigade Peinture & Nettoyage">Brigade Peinture &amp; Nettoyage (Tags, graffitis)</option>
                <option value="Brigade Intervention Spéciale">Brigade Intervention Spéciale (Déchets dangereux, toxiques)</option>
                <option value="Brigade Collecte Express">Brigade Collecte Express (Bacs débordants)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Chef Ouvrier / Ouvrier Responsable de l’Intervention</label>
              <select
                value={targetWorker}
                onChange={e => setTargetWorker(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
              >
                {communalStaff.length > 0 ? (
                  communalStaff.map(s => (
                    <option key={s.id} value={s.fullName}>
                      {s.fullName} ({s.role === 'CHEF_OUVRIER' ? 'Chef de Brigade' : 'Ouvrier'})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Karim Ben Salem (Chef Brigade)">Karim Ben Salem (Chef Brigade Voirie)</option>
                    <option value="Tarek Jouini (Chef Salubrité)">Tarek Jouini (Chef Salubrité)</option>
                    <option value="Équipe Technique d'Intervention">Équipe Technique d'Intervention</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0f172a] mb-1">Priorité d'Intervention &amp; Délais SLA</label>
              <select
                value={targetPriority}
                onChange={e => setTargetPriority(e.target.value)}
                className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
              >
                <option value="URGENTE">Urgente (&lt; 6h) — Risque immédiat de salubrité ou sécurité</option>
                <option value="HAUTE">Haute (&lt; 24h) — Traitement prioritaire standard</option>
                <option value="MOYENNE">Moyenne (&lt; 48h) — Tournée habituelle de voirie</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmer le Dispatching</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationPage;
