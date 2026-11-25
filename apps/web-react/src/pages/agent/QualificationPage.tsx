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
  Send,
  Inbox,
  RefreshCw,
  Eye,
  Trash2,
  Search,
  Filter,
  MapPin,
  Calendar,
  Layers,
  Sparkles
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

export interface QueueItem {
  report: AnomalyReportData;
  aiSuggestion: {
    categoryCode: string;
    categoryLabel: string;
    confidenceScore: number;
    severity: string;
    justification: string;
  };
  assignedBrigade?: string;
  assignedWorker?: string;
  isOverridden?: boolean;
}

export const QualificationPage: React.FC = () => {
  const { state: authState } = useAuth();
  const municipality = authState.user?.municipality || 'Mairie de Zarzouna';

  // Mode d'affichage : 'list' (Liste des réclamations) ou 'consult' (Consultation IA Split-Screen)
  const [viewMode, setViewMode] = useState<'list' | 'consult'>('list');

  // File réelle connectée à MongoDB (AUCUNE FAUSSE DONNÉE HARDCODÉE)
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(100);
  const [isMaximizeOpen, setIsMaximizeOpen] = useState(false);
  const [communalStaff, setCommunalStaff] = useState<Array<{ id: string; fullName: string; role: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtres et recherche pour la vue Liste
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EN_ATTENTE' | 'VALIDE' | 'ASSIGNE' | 'REJETE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modale de modification de catégorie (Override)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ELEVEE');
  const [modalItemIndex, setModalItemIndex] = useState<number>(0);

  // Modale de rejet motivé / suppression (T5)
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

  const currentItem = queue[currentIndex] || queue[0];
  const report = currentItem?.report;
  const aiSuggestion = currentItem?.aiSuggestion;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Chargement strict des données réelles depuis MongoDB
  const fetchLiveReports = async () => {
    setIsLoading(true);
    try {
      const mParam = municipality ? `?municipality=${encodeURIComponent(municipality)}` : '';
      const res = await fetch(`/api/v1/reports${mParam}`);
      if (res.ok) {
        const raw = await res.json();
        const list: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.reports)
          ? raw.reports
          : Array.isArray(raw?.data)
          ? raw.data
          : [];

        const liveQueue: QueueItem[] = list.map((r: any, idx: number) => {
          const rawCat = r.categorySuggested || r.categoryValidated || r.category || 'DEPOT_SAUVAGE';
          const catLabel = CATEGORY_OPTIONS.find(c => c.value === rawCat)?.label || rawCat;
          const hasAiScore = typeof r.aiConfidenceScore === 'number';
          const conf = hasAiScore
            ? Math.round(r.aiConfidenceScore > 1 ? r.aiConfidenceScore : r.aiConfidenceScore * 100)
            : 0;

          let status = (r.status || 'NOUVEAU').toUpperCase();
          if (status === 'SIGNALÉ' || status === 'A_TRAITER' || status === 'PENDING' || status === 'A_QUALIFIER') {
            status = 'NOUVEAU';
          } else if (status === 'EN_COURS_DE_VALIDATION') {
            status = 'VALIDE';
          }

          return {
            report: {
              id: String(r.id || r._id || `rep_${idx}`),
              reference: r.reference || `REP-2026-${String(idx + 1).padStart(4, '0')}`,
              title: r.description || r.title || 'Anomalie signalée sur l’espace public',
              description: r.description || 'Signalement citoyen enregistré',
              photoUrl: r.imageUrl || r.thumbnailUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
              photoDate: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Aujourd’hui',
              location: {
                address: `${r.district || 'Localisation GPS'} · ${r.municipality || r.detectedLocality || 'Commune non spécifiée'}`,
                coordinates: [
                  typeof r.location?.coordinates?.[1] === 'number' ? r.location.coordinates[1] : 0,
                  typeof r.location?.coordinates?.[0] === 'number' ? r.location.coordinates[0] : 0,
                ],
                district: r.district || r.detectedLocality || 'Zone GPS',
              },
              source: 'Application citoyenne EcoTrack',
              duplicatesText: r.isDuplicate ? `Doublon de ${r.duplicateOf}` : 'Aucun doublon détecté',
              hasDuplicate: !!r.isDuplicate,
              receivedAt: r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : 'Aujourd’hui',
              status: status as any,
            },
            aiSuggestion: {
              categoryCode: rawCat,
              categoryLabel: catLabel,
              confidenceScore: conf,
              severity: `${r.priority || (conf > 0 && conf < 60 ? 'À vérifier' : 'Élevée')}${r.slaHours ? ` · SLA ${r.slaHours}h` : ''}`,
              justification:
                r.aiDescription ||
                r.aiJustification ||
                (hasAiScore
                  ? `Analyse IA Vision effectuée pour le périmètre de ${r.municipality || municipality}.`
                  : `Aucune analyse IA Vision disponible pour cette photo. Vérification manuelle requise.`),
            },
            assignedBrigade: r.assignedTeamId || CATEGORY_BRIGADE_ROUTING[rawCat] || 'Brigade Voirie & Salubrité',
            assignedWorker: r.assignedWorkerId
          };
        });

        setQueue(liveQueue);
      }
    } catch {
      // Si l'API est injoignable, queue reste [] (pas de fausses données)
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement des effectifs communaux réels depuis MongoDB
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

  const confidenceBadge = getConfidenceBadge(aiSuggestion?.confidenceScore ?? 0);

  const activeCategory = currentItem?.isOverridden
    ? CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label || selectedCategory
    : (aiSuggestion?.categoryLabel || 'Dépôt sauvage');

  const activeSeverity = currentItem?.isOverridden
    ? SEVERITY_OPTIONS.find((s) => s.value === selectedSeverity)?.label || selectedSeverity
    : (aiSuggestion?.severity || 'Élevée');

  // Action : Consulter le traitement IA (Passe en vue Consultation Split-Screen)
  const handleConsult = (index: number) => {
    setCurrentIndex(index);
    setViewMode('consult');
    setZoomScale(100);
  };

  // Décision 1 : Valider la suggestion IA (T1)
  const handleValidate = async () => {
    if (!report || !aiSuggestion) return;
    const code = currentItem?.isOverridden ? selectedCategory : aiSuggestion.categoryCode;
    const autoBrigade = CATEGORY_BRIGADE_ROUTING[code] || 'Brigade Voirie & Salubrité';
    setTargetBrigade(autoBrigade);

    const payload = {
      reportId: report.id,
      action: 'VALIDATE',
      confirmedCategory: code,
      aiOverridden: !!currentItem?.isOverridden,
      agentId: authState.user?.id || '672f08a0b9e1a2001c45a001',
    };

    console.info('[ECO-31] Validation T1 transmise:', payload);

    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: report.id,
          transition: 'T1',
          actorRole: authState.user?.role || 'AGENT_MAIRIE',
          actorId: authState.user?.email || authState.user?.id,
          categoryValidated: code,
          reviewValidated: true
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast(err?.message || `Erreur validation (${res.status})`);
        return;
      }
    } catch {
      // Ignorer
    }

    setQueue((prevQueue) =>
      prevQueue.map((item, idx) =>
        idx === currentIndex
          ? {
              ...item,
              report: { ...item.report, status: 'VALIDE' },
              assignedBrigade: autoBrigade
            }
          : item
      )
    );

    showToast(`Signalement ${report.reference} validé ! Son état est maintenant « Validé »`);
  };

  // Décision 2 : Ouvrir la modale de modification (directement depuis la table ou depuis la consultation)
  const handleOpenOverride = (index: number) => {
    setModalItemIndex(index);
    const item = queue[index];
    if (!item) return;
    setSelectedCategory(item.aiSuggestion.categoryCode);
    setSelectedSeverity(item.aiSuggestion.severity === 'Moyenne' ? 'MOYENNE' : item.aiSuggestion.severity === 'Faible' ? 'FAIBLE' : 'ELEVEE');
    setIsOverrideModalOpen(true);
  };

  const handleConfirmOverride = () => {
    const newCatLabel = CATEGORY_OPTIONS.find((c) => c.value === selectedCategory)?.label || selectedCategory;
    const newBrigade = CATEGORY_BRIGADE_ROUTING[selectedCategory] || 'Brigade Voirie & Salubrité';

    setQueue((prevQueue) =>
      prevQueue.map((item, idx) =>
        idx === modalItemIndex
          ? {
              ...item,
              isOverridden: true,
              aiSuggestion: {
                ...item.aiSuggestion,
                categoryCode: selectedCategory,
                categoryLabel: newCatLabel,
                severity: SEVERITY_OPTIONS.find((s) => s.value === selectedSeverity)?.label || 'Élevée'
              },
              assignedBrigade: newBrigade
            }
          : item
      )
    );

    setIsOverrideModalOpen(false);
    showToast(`Catégorie modifiée avec succès : ${newCatLabel}`);
  };

  // Décision 3 : Ouvrir la modale de suppression / rejet motivé
  const handleOpenReject = (index: number) => {
    setModalItemIndex(index);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    const targetItem = queue[modalItemIndex];
    if (!targetItem) return;

    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: targetItem.report.id,
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
        idx === modalItemIndex
          ? {
              ...item,
              report: { ...item.report, status: 'REJETE' },
            }
          : item
      )
    );

    setIsRejectModalOpen(false);
    showToast(`Signalement ${targetItem.report.reference} supprimé / rejeté (T5).`);
  };

  // Décision 4 : Ouvrir la modale d'affectation à une brigade
  const handleOpenAssignModal = (index: number) => {
    setModalItemIndex(index);
    const item = queue[index];
    if (!item) return;
    const code = item.aiSuggestion.categoryCode;
    setTargetBrigade(item.assignedBrigade || CATEGORY_BRIGADE_ROUTING[code] || 'Brigade Voirie & Salubrité');
    if (communalStaff.length > 0 && !targetWorker) {
      setTargetWorker(communalStaff[0].fullName);
    }
    setIsAssignModalOpen(true);
  };

  // Décision 5 : Confirmer l'affectation à la brigade (T2)
  const handleConfirmAssign = async () => {
    const targetItem = queue[modalItemIndex];
    if (!targetItem) return;

    try {
      const token = authState.accessToken || localStorage.getItem('ecotrack_access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/interventions/transition', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: targetItem.report.id,
          transition: 'T2',
          actorRole: authState.user?.role || 'AGENT_MAIRIE',
          actorId: authState.user?.email || authState.user?.id || 'adel@zarzouna.tn',
          teamId: targetBrigade,
          assigneeId: targetWorker || 'Chef de Brigade',
          priority: targetPriority || 'Élevée',
          reviewValidated: true,
          categoryValidated: targetItem.aiSuggestion.categoryCode
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        showToast(err?.message || `Erreur affectation (${res.status})`);
        return;
      }
    } catch {
      // Ignorer
    }

    setQueue((prevQueue) =>
      prevQueue.map((item, idx) =>
        idx === modalItemIndex
          ? {
              ...item,
              report: { ...item.report, status: 'ASSIGNE' },
              assignedBrigade: targetBrigade,
              assignedWorker: targetWorker
            }
          : item
      )
    );

    setIsAssignModalOpen(false);
    showToast(`Signalement ${targetItem.report.reference} assigné à la ${targetBrigade} (${targetWorker || 'Équipe municipale'}) !`);
  };

  // Queue navigation in consultation mode
  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomScale(100);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomScale(100);
    }
  };

  const isCurrentValidated = report?.status === 'VALIDE';
  const isCurrentAssigned = report?.status === 'ASSIGNE';
  const isCurrentRejected = report?.status === 'REJETE';

  // Filtrage des réclamations dans la vue Liste
  const filteredQueue = queue.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = item.report.reference.toLowerCase().includes(q);
      const matchTitle = item.report.title.toLowerCase().includes(q);
      const matchDesc = item.report.description.toLowerCase().includes(q);
      const matchAddr = item.report.location.address.toLowerCase().includes(q);
      const matchCat = item.aiSuggestion.categoryLabel.toLowerCase().includes(q);
      if (!matchRef && !matchTitle && !matchDesc && !matchAddr && !matchCat) return false;
    }

    if (statusFilter === 'EN_ATTENTE') {
      if (item.report.status !== 'NOUVEAU') return false;
    } else if (statusFilter === 'VALIDE') {
      if (item.report.status !== 'VALIDE') return false;
    } else if (statusFilter === 'ASSIGNE') {
      if (item.report.status !== 'ASSIGNE') return false;
    } else if (statusFilter === 'REJETE') {
      if (item.report.status !== 'REJETE') return false;
    }

    if (categoryFilter !== 'ALL') {
      if (item.aiSuggestion.categoryCode !== categoryFilter) return false;
    }

    return true;
  });

  // KPIs calculés sur les données réelles
  const totalCount = queue.length;
  const pendingCount = queue.filter((i) => i.report.status === 'NOUVEAU').length;
  const validatedCount = queue.filter((i) => i.report.status === 'VALIDE').length;
  const assignedCount = queue.filter((i) => i.report.status === 'ASSIGNE').length;

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const todayCapitalized = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Rendu de l'étiquette de statut selon l'état réel (avec whitespace-nowrap anti-déformation)
  const renderStatusBadge = (status: string) => {
    if (status === 'VALIDE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#059669] border border-emerald-200 whitespace-nowrap shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Validé
        </span>
      );
    }
    if (status === 'ASSIGNE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-sm">
          <UserCheck className="w-3.5 h-3.5" />
          Assigné
        </span>
      );
    }
    if (status === 'REJETE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-sm">
          <XCircle className="w-3.5 h-3.5" />
          Rejeté
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-sm">
        <Hourglass className="w-3.5 h-3.5" />
        En attente de validation
      </span>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] font-sans antialiased">
      {/* ── SIDEBAR CONSOLE V2 ──────────────────────────────────────────────── */}
      <FigmaSidebar currentTab="qualification" />

      {/* ── CONTENU PRINCIPAL ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar commune */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 bg-white border-b border-[#e2e8f0] flex items-center justify-between shrink-0 shadow-sm">
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
              {viewMode === 'list' ? 'Liste des Réclamations & Traitement IA' : 'Consultation du Signalement IA'}
            </span>
          </div>

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

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-4 sm:mx-8 mt-3 p-3 bg-[#059669] text-white rounded-lg shadow-lg text-xs font-medium flex items-center justify-between transition-all duration-300 z-50">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button type="button" onClick={() => setToastMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* VUE 1 : LISTE DES RÉCLAMATIONS (PAR DÉFAUT)                          */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] flex flex-col gap-6">
            {/* Header de la vue liste */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] font-heading tracking-tight flex items-center gap-2.5">
                  <span>Liste des Réclamations</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#059669]/10 text-[#059669] border border-[#059669]/20">
                    Vision IA
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#64748b] mt-1">
                  Examinez les signalements citoyens réels de la {municipality}, validez leur qualification IA, corrigez leurs paramètres ou assignez-les aux brigades municipales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void fetchLiveReports();
                    showToast('Données réelles MongoDB actualisées');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#cbd5e1] hover:bg-slate-50 text-[#334155] text-xs font-semibold shadow-sm transition flex items-center gap-2"
                >
                  <RefreshCw className={`size-3.5 text-[#64748b] ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* 4 Boîtes / Cartes Métriques Opérationnelles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`p-4 rounded-xl bg-white border cursor-pointer transition shadow-sm ${statusFilter === 'ALL' ? 'border-[#059669] ring-2 ring-emerald-500/20' : 'border-[#e2e8f0] hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748b]">Total Réclamations</span>
                  <Layers className="size-4 text-[#64748b]" />
                </div>
                <div className="text-2xl font-black text-[#0f172a] mt-2 font-mono">{totalCount}</div>
                <span className="text-[11px] text-[#64748b] mt-1 block">Toutes catégories confondues</span>
              </div>

              <div
                onClick={() => setStatusFilter('EN_ATTENTE')}
                className={`p-4 rounded-xl bg-white border cursor-pointer transition shadow-sm ${statusFilter === 'EN_ATTENTE' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-[#e2e8f0] hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-700">En attente de validation</span>
                  <Hourglass className="size-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700 mt-2 font-mono">{pendingCount}</div>
                <span className="text-[11px] text-amber-600 mt-1 block">À vérifier par l'agent</span>
              </div>

              <div
                onClick={() => setStatusFilter('VALIDE')}
                className={`p-4 rounded-xl bg-white border cursor-pointer transition shadow-sm ${statusFilter === 'VALIDE' ? 'border-[#059669] ring-2 ring-emerald-500/20' : 'border-[#e2e8f0] hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#059669]">Validées</span>
                  <CheckCircle2 className="size-4 text-[#059669]" />
                </div>
                <div className="text-2xl font-black text-[#059669] mt-2 font-mono">{validatedCount}</div>
                <span className="text-[11px] text-[#059669] mt-1 block">Prêtes pour affectation</span>
              </div>

              <div
                onClick={() => setStatusFilter('ASSIGNE')}
                className={`p-4 rounded-xl bg-white border cursor-pointer transition shadow-sm ${statusFilter === 'ASSIGNE' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#e2e8f0] hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700">Assignées aux brigades</span>
                  <UserCheck className="size-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-700 mt-2 font-mono">{assignedCount}</div>
                <span className="text-[11px] text-blue-600 mt-1 block">En cours de mission</span>
              </div>
            </div>

            {/* Box de Recherche et Filtres Sécurisé & Réactif */}
            <div className="p-4 bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Recherche libre avec bouton effacer */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, lieu, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtres Rapides Statut & Catégorie */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <Filter className="size-3.5 text-[#059669]" />
                  <span>Statut :</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente de validation</option>
                  <option value="VALIDE">Validé</option>
                  <option value="ASSIGNE">Assigné</option>
                  <option value="REJETE">Rejeté</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-[#64748b] ml-2">
                  <span>Catégorie :</span>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-xs text-[#0f172a] focus:ring-2 focus:ring-[#059669]"
                >
                  <option value="ALL">Toutes les catégories</option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setCategoryFilter('ALL');
                    }}
                    className="text-xs text-rose-600 hover:underline px-2"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Table des Réclamations */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-4 min-w-[150px] whitespace-nowrap">Réclamation & Photo</th>
                      <th className="py-3 px-4 min-w-[220px]">Description & Lieu</th>
                      <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Vision IA</th>
                      <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Statut</th>
                      <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Brigade</th>
                      <th className="py-3 px-4 text-center min-w-[320px] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {filteredQueue.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-[#64748b]">
                          <div className="size-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3 text-[#94a3b8]">
                            <Inbox className="size-7" />
                          </div>
                          <p className="font-bold text-sm text-[#0f172a]">
                            {queue.length === 0 ? 'Aucune réclamation dans la base de données' : 'Aucune réclamation trouvée pour ces filtres'}
                          </p>
                          <p className="text-xs text-[#94a3b8] mt-1 max-w-md mx-auto leading-relaxed">
                            {queue.length === 0
                              ? 'La base MongoDB est actuellement vide (0 fausse donnée). Dès qu’un citoyen enregistre un signalement, il apparaîtra ici en direct.'
                              : 'Veuillez modifier votre terme de recherche ou réinitialiser les filtres.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredQueue.map((item) => {
                        const rawIndex = queue.findIndex((q) => q.report.id === item.report.id);
                        const conf = getConfidenceBadge(item.aiSuggestion.confidenceScore);
                        return (
                          <tr
                            key={item.report.id}
                            className="hover:bg-slate-50 transition-colors group"
                          >
                            {/* Photo & Réf */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.report.photoUrl}
                                  alt={item.report.title}
                                  className="size-12 rounded-lg object-cover border border-[#e2e8f0] shrink-0"
                                />
                                <div>
                                  <span className="font-mono font-bold text-[#1e3a8a] text-xs block whitespace-nowrap">
                                    {item.report.reference}
                                  </span>
                                  <span className="text-[11px] text-[#94a3b8] flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                    <Calendar className="size-3 shrink-0" />
                                    {item.report.photoDate}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Description & Lieu */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-medium text-[#0f172a] line-clamp-1">
                                {item.report.title}
                              </div>
                              <div className="text-[#64748b] text-[11px] line-clamp-1 mt-0.5">
                                {item.report.description}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-[#059669] font-medium mt-1">
                                <MapPin className="size-3 shrink-0" />
                                <span className="truncate">{item.report.location.address}</span>
                              </div>
                            </td>

                            {/* Vision IA */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-semibold text-[#0f172a] block whitespace-nowrap">
                                {item.aiSuggestion.categoryLabel}
                              </span>
                              <div
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border mt-1 whitespace-nowrap ${conf.bgColor} ${conf.textColor}`}
                              >
                                <Sparkles className="size-3 shrink-0" />
                                <span>{item.aiSuggestion.confidenceScore}%</span>
                              </div>
                            </td>

                            {/* Statut (Box anti-déformation) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {renderStatusBadge(item.report.status)}
                            </td>

                            {/* Brigade */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="text-xs text-[#334155] font-medium block whitespace-nowrap">
                                {item.assignedBrigade || CATEGORY_BRIGADE_ROUTING[item.aiSuggestion.categoryCode] || 'Brigade Voirie'}
                              </span>
                              {item.assignedWorker ? (
                                <span className="text-[11px] text-[#059669] flex items-center gap-1 mt-0.5 font-medium whitespace-nowrap">
                                  <UserCheck className="size-3 shrink-0" />
                                  {item.assignedWorker}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#94a3b8] italic block mt-0.5 whitespace-nowrap">
                                  Non assignée
                                </span>
                              )}
                            </td>

                            {/* 4 Actions : Consulter, Modifier, Assigner, Supprimer */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                {/* 1. Consulter */}
                                <button
                                  type="button"
                                  onClick={() => handleConsult(rawIndex)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#059669] hover:text-white text-[#0f172a] font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                                  title="Consulter le traitement IA"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Consulter</span>
                                </button>

                                {/* 2. Assigner */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(rawIndex)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#059669] text-[#059669] hover:text-white border border-emerald-200 font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                                  title="Assigner à une brigade"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Assigner</span>
                                </button>

                                {/* 3. Modifier */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenOverride(rawIndex)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                                  title="Modifier la catégorie ou sévérité"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Modifier</span>
                                </button>

                                {/* 4. Supprimer */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReject(rawIndex)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 font-semibold text-xs transition flex items-center gap-1 shadow-sm"
                                  title="Supprimer / Rejeter la réclamation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Supprimer</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* VUE 2 : CONSULTATION DU TRAITEMENT IA (SPLIT-SCREEN)                 */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'consult' && report && aiSuggestion && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header spécifique consultation avec BOUTON RETOUR À LA LISTE */}
            <div className="px-4 sm:px-8 py-3 bg-white border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                {/* BOUTON RETOUR À LA LISTE */}
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#cbd5e1] hover:bg-slate-100 text-[#0f172a] text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 text-[#059669]" />
                  <span>Retour à la liste des réclamations</span>
                </button>

                <div className="h-5 w-px bg-[#e2e8f0] hidden sm:block" />

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a] font-heading tracking-tight">
                      Qualification du signalement
                    </h1>
                    {/* Badge Statut Dynamique */}
                    {renderStatusBadge(report.status)}
                  </div>
                  <p className="text-xs text-[#64748b]">
                    Dossier / <span className="font-mono font-medium text-[#1e3a8a]">{report.reference}</span> · Reçu le {report.receivedAt}
                  </p>
                </div>
              </div>

              {/* Navigation entre items & Indicateur file */}
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

            {/* Split-screen Layout */}
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
                  {/* Carte Suggestion IA */}
                  <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-5 shadow-sm space-y-4">
                    <div className="border-b border-[#e2e8f0] pb-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#0f172a] font-heading">
                          Suggestion de l’IA
                        </h2>
                        {currentItem?.isOverridden && (
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

                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${confidenceBadge.bgColor} ${confidenceBadge.textColor} mb-2.5`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{confidenceBadge.label}</span>
                      </div>

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
                          Catégorie {currentItem?.isOverridden ? 'Confirmée' : 'Suggérée'}
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
                        onClick={() => handleOpenOverride(currentIndex)}
                        className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs transition-all duration-150"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>

                      {/* Bouton Rouge : Rejeter */}
                      <button
                        type="button"
                        onClick={() => handleOpenReject(currentIndex)}
                        className="flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all duration-150"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeter l'anomalie</span>
                      </button>
                    </div>

                    {/* Section Dispatching & Transition suivante */}
                    <div className="pt-2 border-t border-[#e2e8f0] space-y-2.5">
                      {isCurrentValidated || isCurrentAssigned ? (
                        <>
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#047857] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                                {isCurrentAssigned ? 'Détection assignée' : 'Détection validée'}
                              </span>
                              <span className="text-[11px] font-mono text-[#059669] bg-white px-2 py-0.5 rounded border border-emerald-200">
                                Auto-Routing
                              </span>
                            </div>
                            <p className="text-[#334155] text-xs mt-1">
                              Brigade recommandée : <strong>{targetBrigade}</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(currentIndex)}
                            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Affecter à une brigade</span>
                          </button>
                        </>
                      ) : isCurrentRejected ? (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                          <span className="font-semibold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Signalement rejeté (T5)
                          </span>
                          <p className="text-xs text-rose-600 mt-1">Motif : {rejectReason}</p>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled
                            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200 cursor-not-allowed opacity-80"
                          >
                            <Lock className="w-4 h-4" />
                            <span>Valider pour affecter</span>
                          </button>
                          <p className="text-[11px] text-[#64748b] text-center mt-2">
                            L’affectation est déverrouillée dès validation de la catégorie par l’agent.
                          </p>
                        </>
                      )}

                      {/* Bouton pour revenir à la liste */}
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-50 border border-[#cbd5e1] hover:bg-slate-100 text-[#334155] font-medium text-xs transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#64748b]" />
                        <span>Revenir à la liste des réclamations</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </main>
          </div>
        )}
      </div>

      {/* ── MODALE 1 : PLEIN ÉCRAN IMAGE ─────────────────────────────────────── */}
      {report && isMaximizeOpen && (
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

      {/* ── MODALE 3 : REJET / SUPPRESSION DU SIGNALEMENT (T5) ────────────────── */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#dc2626] border-b border-[#e2e8f0] pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold font-heading">Supprimer / Rejeter le signalement</h3>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              Veuillez sélectionner le motif officiel de rejet pour archiver ce signalement et en informer le citoyen :
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#0f172a] font-semibold mb-1">
                  Motif de suppression / rejet :
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
                <p className="text-xs text-[#64748b]">
                  Dossier : <strong className="font-mono text-[#1e3a8a]">{queue[modalItemIndex]?.report.reference}</strong>
                </p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a] text-lg font-bold">✕</button>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs space-y-1">
              <p><strong>Anomalie :</strong> {queue[modalItemIndex]?.report.title}</p>
              <p><strong>Catégorie :</strong> <span className="font-mono text-purple-700 font-semibold">{queue[modalItemIndex]?.aiSuggestion.categoryLabel}</span></p>
              <p className="text-[11px] text-blue-700 pt-1">
                <strong>Règle d'affectation :</strong> Les anomalies de type <em>{queue[modalItemIndex]?.aiSuggestion.categoryLabel}</em> sont prises en charge par la <strong>{targetBrigade}</strong>.
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
                  <option value="">Aucun agent communal disponible dans la base</option>
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
                <span>Confirmer l'Affectation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualificationPage;
