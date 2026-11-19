import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import {
  Users,
  BarChart3,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  FileText,
  PlusCircle,
  Search,
  Trash2,
  Camera
} from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  municipality?: string;
  brigade: string;
  assignedCount: number;
}

interface SlaCategory {
  slug: string;
  label: string;
  defaultSeverity: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
  slaHours: number;
  brigade: string;
}

interface MunicipalReport {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  district: string;
  status: 'NOUVEAU' | 'EN_COURS_DE_VALIDATION' | 'VALIDE' | 'ASSIGNE' | 'EN_TRAITEMENT' | 'RESOLU' | 'REJETE';
  severity: 'Faible' | 'Moyenne' | 'Élevée' | 'Critique';
  createdAt: string;
  assignedWorker?: string;
  photoUrl?: string;
  resolvedPhotoUrl?: string;
}

export const AdminMairieDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const municipality = authState.user?.municipality || 'Municipalité de Zarzouna';

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab') as 'overview' | 'reports' | 'users' | 'categories' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'categories'>(
    currentTabParam && ['overview', 'reports', 'users', 'categories'].includes(currentTabParam)
      ? currentTabParam
      : 'overview'
  );

  useEffect(() => {
    if (currentTabParam && ['overview', 'reports', 'users', 'categories'].includes(currentTabParam)) {
      setActiveTab(currentTabParam);
    } else if (!currentTabParam) {
      setActiveTab('overview');
    }
  }, [currentTabParam]);

  const switchTab = (tab: 'overview' | 'reports' | 'users' | 'categories') => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Liste du personnel communal
  const [agents, setAgents] = useState<StaffUser[]>([]);

  const fetchAgents = () => {
    fetch('/api/v1/auth/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.users)) {
          const list = data.users
            .filter((u: any) =>
              (u.role === 'AGENT_MAIRIE' || u.role === 'CHEF_OUVRIER' || u.role === 'OUVRIER') &&
              (!u.municipality || u.municipality === municipality || municipality.includes(u.municipality) || u.municipality.includes(municipality))
            )
            .map((u: any) => ({
              id: u.id,
              name: u.fullName,
              email: u.email,
              role: u.role,
              active: u.isActive !== false,
              municipality: u.municipality,
              brigade: u.role === 'CHEF_OUVRIER' ? 'Voirie & Salubrité' : u.role === 'OUVRIER' ? 'Équipe Technique' : 'Pôle Modération',
              assignedCount: u.role === 'CHEF_OUVRIER' ? 3 : 1
            }));
          setAgents(list);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAgents();
  }, [municipality]);

  // 2. Catégories & Seuils SLA locaux (Figma: WEB_ADM_02_CATEGORIES)
  const [categories, setCategories] = useState<SlaCategory[]>([
    { slug: 'DEPOT_SAUVAGE', label: 'Dépôts sauvages', defaultSeverity: 'Élevée', slaHours: 24, brigade: 'Voirie & Salubrité' },
    { slug: 'ENCOMBRANTS', label: 'Objets encombrants', defaultSeverity: 'Moyenne', slaHours: 48, brigade: 'Ramassage Poids Lourd' },
    { slug: 'DECHETS_DANGEREUX', label: 'Déchets dangereux ou toxiques', defaultSeverity: 'Critique', slaHours: 12, brigade: 'Intervention Spéciale' },
    { slug: 'GRAFFITI', label: 'Dégradations & Graffitis', defaultSeverity: 'Faible', slaHours: 72, brigade: 'Peinture & Nettoyage' },
    { slug: 'DEBORDEMENT_BAC', label: 'Débordement de bacs à ordures', defaultSeverity: 'Élevée', slaHours: 24, brigade: 'Collecte Express' },
    { slug: 'DECHETS_VERTS', label: 'Déchets végétaux & Élagage', defaultSeverity: 'Moyenne', slaHours: 48, brigade: 'Espaces Verts' },
  ]);

  // 3. Réclamations et signalements municipaux
  const [reports, setReports] = useState<MunicipalReport[]>([
    {
      id: 'rep_zar_001',
      reference: 'REP-2026-0841',
      title: 'Dépôt sauvage de gravats sur trottoir',
      description: 'Déversement clandestin de gravats obstruant le passage piétonnier.',
      category: 'DEPOT_SAUVAGE',
      district: 'Avenue Habib Bourguiba',
      status: 'ASSIGNE',
      severity: 'Élevée',
      createdAt: 'Aujourd\'hui à 09:15',
      assignedWorker: 'Karim Ben Salem (Chef Ouvrier)',
      photoUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'rep_zar_002',
      reference: 'REP-2026-0842',
      title: 'Conteneurs débordants près du marché',
      description: 'Accumulation d\'ordures ménagères autour des bacs municipaux.',
      category: 'DEBORDEMENT_BAC',
      district: 'Place du Marché',
      status: 'EN_TRAITEMENT',
      severity: 'Élevée',
      createdAt: 'Aujourd\'hui à 08:30',
      assignedWorker: 'Karim Ben Salem (Chef Ouvrier)',
      photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80'
    },
    {
      id: 'rep_zar_003',
      reference: 'REP-2026-0839',
      title: 'Nettoyage et évacuation terminée',
      description: 'Anomalie de déchets verts évacuée avec photo de conformité.',
      category: 'DECHETS_VERTS',
      district: 'Cité Ouvrière',
      status: 'RESOLU',
      severity: 'Moyenne',
      createdAt: 'Hier à 14:10',
      assignedWorker: 'Tarek Jouini (Chef Ouvrier)',
      photoUrl: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80',
      resolvedPhotoUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('ALL');

  // Filtre des signalements
  const filteredReports = reports.filter(r => {
    const matchSearch =
      r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.reference.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.district.toLowerCase().includes(reportSearch.toLowerCase());
    const matchStatus = reportStatusFilter === 'ALL' || r.status === reportStatusFilter;
    return matchSearch && matchStatus;
  });

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('AGENT_MAIRIE');
  const [newUserBrigade, setNewUserBrigade] = useState('Voirie & Salubrité');

  // Modal d'édition SLA
  const [editingCategory, setEditingCategory] = useState<SlaCategory | null>(null);

  // Modal d'assignation de signalement
  const [assigningReport, setAssigningReport] = useState<MunicipalReport | null>(null);
  const [targetWorker, setTargetWorker] = useState<string>('');

  // Modal d'ajout de signalement direct par la mairie
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportDesc, setNewReportDesc] = useState('');
  const [newReportCategory, setNewReportCategory] = useState('DEPOT_SAUVAGE');
  const [newReportDistrict, setNewReportDistrict] = useState('Centre-Ville');

  // Gestionnaire d'ajout de collaborateur
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    if (newUserPassword && newUserPassword.length < 8) {
      alert('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword.trim() || 'Agent2026!',
          fullName: newUserName.trim(),
          role: newUserRole,
          municipality
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Impossible de créer le compte');
      }

      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      showToast(`Collaborateur ${newUserName} créé avec succès pour ${municipality}`);
      fetchAgents();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Suppression d'un collaborateur
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Confirmez-vous la désactivation du compte de ${name} ?`)) return;
    try {
      const res = await fetch(`/api/v1/auth/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Compte de ${name} supprimé avec succès`);
        fetchAgents();
      }
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  // Mise à jour SLA d'une catégorie
  const handleSaveSla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCategories(prev =>
      prev.map(c => c.slug === editingCategory.slug ? editingCategory : c)
    );
    showToast(`Seuil SLA de « ${editingCategory.label} » mis à jour (${editingCategory.slaHours}h)`);
    setEditingCategory(null);
  };

  // Assignation d'un signalement à un chef ouvrier
  const handleAssignReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReport || !targetWorker) return;
    setReports(prev =>
      prev.map(r => r.id === assigningReport.id ? { ...r, status: 'ASSIGNE', assignedWorker: targetWorker } : r)
    );
    showToast(`Signalement ${assigningReport.reference} assigné à ${targetWorker}`);
    setAssigningReport(null);
    setTargetWorker('');
  };

  // Création d'un signalement direct par les services techniques municipaux
  const handleCreateDirectReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportTitle) return;

    const newRep: MunicipalReport = {
      id: `rep_${Date.now()}`,
      reference: `REP-2026-0${Math.floor(850 + Math.random() * 50)}`,
      title: newReportTitle,
      description: newReportDesc || 'Signalement interne enregistré par la direction municipale.',
      category: newReportCategory,
      district: newReportDistrict,
      status: 'NOUVEAU',
      severity: 'Élevée',
      createdAt: 'À l\'instant',
      photoUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=400&q=80'
    };

    setReports([newRep, ...reports]);
    setShowAddReportModal(false);
    setNewReportTitle('');
    setNewReportDesc('');
    showToast(`Signalement municipal direct ${newRep.reference} créé avec succès`);
  };

  // Calcul des statistiques rapides
  const totalReportsCount = reports.length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLU').length;
  const inProgressCount = reports.filter(r => r.status === 'ASSIGNE' || r.status === 'EN_TRAITEMENT').length;
  const newCount = reports.filter(r => r.status === 'NOUVEAU' || r.status === 'EN_COURS_DE_VALIDATION').length;
  const resolutionRate = totalReportsCount > 0 ? Math.round((resolvedCount / totalReportsCount) * 100) : 94;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#102c35] text-white px-4 py-3 rounded-[10px] shadow-xl border border-[#059669] flex items-center gap-2 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Admin Municipalité (Figma: WEB_ADM_01_USERS) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
              Direction Municipale
            </h1>
            <span className="px-2.5 py-0.5 rounded-[6px] text-[11px] font-bold bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe]">
              {municipality}
            </span>
          </div>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Pilotage stratégique des services urbains de la commune, suivi des délais d'intervention (SLA) et coordination des brigades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Pilotage & Analyses</span>
          </Link>
          <Link
            to="/supervision"
            className="inline-flex items-center gap-2 bg-white border border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#eff6ff] font-semibold px-4 h-[44px] rounded-[8px] text-[13px] transition shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            <span>Carte Territoriale</span>
          </Link>
        </div>
      </div>

      {/* Onglets de navigation interne (Figma: Overview / Reports / Users / Categories) */}
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-2 overflow-x-auto">
        <button
          onClick={() => switchTab('overview')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          Vue d'ensemble & KPIs
        </button>
        <button
          onClick={() => switchTab('reports')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          <span>Signalements & Suivi</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#059669] text-white font-bold">{reports.length}</span>
        </button>
        <button
          onClick={() => switchTab('users')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          <span>Utilisateurs & Brigades</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">{agents.length}</span>
        </button>
        <button
          onClick={() => switchTab('categories')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          <span>Catégories & Seuils SLA</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">{categories.length}</span>
        </button>
      </div>

      {/* ================= ONGLET 1 : VUE D'ENSEMBLE ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cartes KPI Figma */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Taux de Résolution Municipal</span>
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{resolutionRate}%</div>
              <div className="flex items-center gap-1 text-[11px] text-[#059669] mt-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+3.8% ce mois</span>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Délai Moyen d'Intervention</span>
                <Clock className="w-4 h-4 text-[#2563eb]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">24.5 h</div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">Conforme aux seuils SLA (&lt; 48h)</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Personnel Communal</span>
                <Users className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{agents.length}</div>
              <p className="text-[11px] text-[#475569] mt-1">
                {agents.filter(a => a.role === 'CHEF_OUVRIER').length} chefs ouvriers · {agents.filter(a => a.role === 'AGENT_MAIRIE').length} agents
              </p>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Signalements en Cours</span>
                <AlertTriangle className="w-4 h-4 text-[#d97706]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{inProgressCount}</div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">{newCount} en attente · 0 retard critique</p>
            </div>
          </div>

          {/* Synthèse Opérationnelle & Cartographie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e2e8f0] p-6 rounded-[12px] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0f172a]">Performance par Secteur ({municipality})</h3>
                <span className="text-xs text-[#059669] font-semibold">Temps réel</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Centre & Voie Principale', score: 98, count: 18, delay: '14h' },
                  { name: 'Quartier du Port & Pêche', score: 94, count: 12, delay: '22h' },
                  { name: 'Zone Résidentielle Ouest', score: 91, count: 9, delay: '28h' },
                  { name: 'Zone Industrielle & Dépôts', score: 96, count: 6, delay: '18h' },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                    <div>
                      <span className="font-semibold text-[#0f172a]">{d.name}</span>
                      <p className="text-[#64748b] text-[11px]">{d.count} interventions enregistrées</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#059669]">{d.score}% conformité</span>
                      <p className="text-[#64748b] text-[11px]">Délai moy. {d.delay}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-6 rounded-[12px] shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#0f172a]">Ressources Décisionnelles & Power BI</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Le maire dispose d'une isolation stricte de ses données grâce au Row-Level Security (RLS) PostgreSQL & Power BI, garantissant l'accès exclusif aux données de <strong>{municipality}</strong>.
              </p>
              <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] text-xs space-y-2">
                <p className="font-semibold text-[#1e3a8a]">Tableaux de bord analytiques locaux</p>
                <p className="text-[#3b82f6]">
                  Consultez le taux de concordance IA/humain, la charge par brigade et les tendances de salubrité territoriale.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/admin/analytics"
                    className="inline-flex items-center gap-1.5 text-[#1e3a8a] font-bold text-xs underline"
                  >
                    Ouvrir Power BI Communal →
                  </Link>
                  <Link
                    to="/supervision"
                    className="inline-flex items-center gap-1.5 text-[#059669] font-bold text-xs underline"
                  >
                    Voir la Carte Territoriale →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ONGLET 2 : SIGNALEMENTS & SUIVI ================= */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Réclamations & Signalements Territoriaux</h3>
              <p className="text-xs text-[#475569]">Suivi des anomalies citoyennes et dispatching vers les brigades de {municipality}.</p>
            </div>
            <button
              onClick={() => setShowAddReportModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-3.5 py-2 rounded-[8px] text-xs shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Signalement Direct</span>
            </button>
          </div>

          {/* Barre de filtres & recherche */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher par réf, titre, secteur..."
                value={reportSearch}
                onChange={e => setReportSearch(e.target.value)}
                className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] pl-9 pr-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-[#475569]">Statut :</span>
              <select
                value={reportStatusFilter}
                onChange={e => setReportStatusFilter(e.target.value)}
                className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] px-3 py-2 text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#059669]"
              >
                <option value="ALL">Tous les statuts ({reports.length})</option>
                <option value="NOUVEAU">Nouveau (en attente)</option>
                <option value="ASSIGNE">Assigné à une équipe</option>
                <option value="EN_TRAITEMENT">En traitement</option>
                <option value="RESOLU">Résolu</option>
                <option value="REJETE">Rejeté</option>
              </select>
            </div>
          </div>

          {/* Table des signalements */}
          <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] h-[40px]">
                  <th className="py-2.5 px-4">Référence & Photo</th>
                  <th className="py-2.5 px-4">Description & Lieu</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4">Brigade / Responsable</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#64748b]">
                      <FileText className="w-8 h-8 mx-auto text-[#94a3b8] mb-2" />
                      <p className="font-semibold text-sm text-[#0f172a]">Aucune réclamation trouvée</p>
                      <p className="text-xs text-[#64748b] mt-1">
                        Utilisez « Nouveau Signalement Direct » pour enregistrer un cas test.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#f8fafc] h-[64px]">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {r.photoUrl ? (
                            <img src={r.photoUrl} alt="Photo" className="w-10 h-10 object-cover rounded-[6px] border border-[#e2e8f0]" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-[6px] text-[#94a3b8]">
                              <Camera className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-mono font-bold text-[#0f172a] block">{r.reference}</span>
                            <span className="text-[10px] text-[#64748b]">{r.createdAt}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[#0f172a] max-w-xs truncate">{r.title}</div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#94a3b8]" />
                          <span>{r.district}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-[#0f172a] border border-[#e2e8f0]">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold ${
                          r.status === 'RESOLU' ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]' :
                          r.status === 'EN_TRAITEMENT' ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' :
                          r.status === 'ASSIGNE' ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#475569]">
                        {r.assignedWorker || <span className="text-[#94a3b8] italic">Non assigné</span>}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setAssigningReport(r)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1e3a8a] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-[6px] border border-[#bfdbfe] transition"
                        >
                          Assigner
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ONGLET 3 : UTILISATEURS & BRIGADES (Figma: WEB_ADM_01_USERS) ================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Personnel & Brigades Municipales ({municipality})</h3>
              <p className="text-xs text-[#475569]">Gérez les agents de modération et les équipes terrain affectés à la commune.</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white font-semibold px-3.5 py-2 rounded-[8px] text-xs shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter un Collaborateur</span>
            </button>
          </div>

          <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] h-[40px]">
                  <th className="py-2.5 px-4">Collaborateur</th>
                  <th className="py-2.5 px-4">Rôle</th>
                  <th className="py-2.5 px-4">Affectation / Brigade</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-[#64748b]">
                      <Users className="w-8 h-8 mx-auto text-[#94a3b8] mb-2" />
                      <p className="font-semibold text-sm text-[#0f172a]">Aucun collaborateur dans cette commune</p>
                      <p className="text-xs text-[#64748b] mt-1">
                        Cliquez sur "Ajouter un Collaborateur" pour enregistrer un agent ou un chef d'équipe terrain.
                      </p>
                    </td>
                  </tr>
                ) : (
                  agents.map((a) => (
                    <tr key={a.id} className="hover:bg-[#f8fafc] h-[52px]">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-[#0f172a]">{a.name}</div>
                        <div className="text-[#64748b] text-[11px]">{a.email}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] border border-[#e2e8f0]">
                          {a.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#475569]">
                        {a.brigade}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[#059669] font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Actif
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(a.id, a.name)}
                          className="text-[#dc2626] hover:text-[#b91c1c] font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ONGLET 4 : CATÉGORIES & SLA (Figma: WEB_ADM_02_CATEGORIES) ================= */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Configuration des Catégories & Délais Légaux (SLA)</h3>
              <p className="text-xs text-[#475569]">Ajustez les délais d'intervention maximaux et les brigades responsables pour {municipality}.</p>
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] h-[40px]">
                  <th className="py-2.5 px-4">Type d'Anomalie</th>
                  <th className="py-2.5 px-4">Sévérité Initiale</th>
                  <th className="py-2.5 px-4">Délai Max Légale (SLA)</th>
                  <th className="py-2.5 px-4">Brigade Assignée</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {categories.map((c) => (
                  <tr key={c.slug} className="hover:bg-[#f8fafc] h-[52px]">
                    <td className="py-2.5 px-4 font-semibold text-[#0f172a]">{c.label}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        c.defaultSeverity === 'Critique' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        c.defaultSeverity === 'Élevée' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.defaultSeverity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#059669]">{c.slaHours} heures</td>
                    <td className="py-2.5 px-4 text-[#475569]">{c.brigade}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => setEditingCategory(c)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#1e3a8a] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-[6px] border border-[#bfdbfe] transition"
                      >
                        Ajuster SLA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Ajout Collaborateur */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Nouveau Collaborateur Municipal</h3>
                <p className="text-xs text-[#64748b]">{municipality}</p>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tarek Jouini"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Adresse e-mail professionnelle</label>
                <input
                  type="email"
                  required
                  placeholder="tarek.jouini@mairie.tn"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Mot de passe initial</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="•••••••• (min. 8 caractères, ex: Equipe2026!)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Rôle opérationnel</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  >
                    <option value="CHEF_OUVRIER">Chef Ouvrier (Missions)</option>
                    <option value="AGENT_MAIRIE">Agent Mairie (Modération)</option>
                    <option value="OUVRIER">Ouvrier Technique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Brigade affectée</label>
                  <select
                    value={newUserBrigade}
                    onChange={e => setNewUserBrigade(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  >
                    <option value="Voirie & Salubrité">Voirie & Salubrité</option>
                    <option value="Ramassage Poids Lourd">Ramassage Poids Lourd</option>
                    <option value="Intervention Spéciale">Intervention Spéciale</option>
                    <option value="Espaces Verts">Espaces Verts</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Ajustement Seuil SLA */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Ajustement du Seuil SLA</h3>
                <p className="text-xs text-[#64748b]">{editingCategory.label}</p>
              </div>
              <button onClick={() => setEditingCategory(null)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <form onSubmit={handleSaveSla} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Délai Max d'Intervention (Heures)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  required
                  value={editingCategory.slaHours}
                  onChange={e => setEditingCategory({ ...editingCategory, slaHours: parseInt(e.target.value) || 24 })}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
                <p className="text-[11px] text-[#64748b] mt-1">Au-delà de ce délai, le signalement passe en alerte dépassement.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Sévérité par défaut</label>
                <select
                  value={editingCategory.defaultSeverity}
                  onChange={e => setEditingCategory({ ...editingCategory, defaultSeverity: e.target.value as any })}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                >
                  <option value="Faible">Faible</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Élevée">Élevée</option>
                  <option value="Critique">Critique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Brigade responsable</label>
                <input
                  type="text"
                  required
                  value={editingCategory.brigade}
                  onChange={e => setEditingCategory({ ...editingCategory, brigade: e.target.value })}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
                >
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Assignation Signalement */}
      {assigningReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Assignation d'Équipe Terrain</h3>
                <p className="text-xs text-[#64748b]">{assigningReport.reference} · {assigningReport.title}</p>
              </div>
              <button onClick={() => setAssigningReport(null)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <form onSubmit={handleAssignReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Sélectionner un Chef d'Équipe ou Brigade</label>
                <select
                  required
                  value={targetWorker}
                  onChange={e => setTargetWorker(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                >
                  <option value="">-- Choisir un responsable terrain --</option>
                  {agents.filter(a => a.role === 'CHEF_OUVRIER').length > 0 ? (
                    agents.filter(a => a.role === 'CHEF_OUVRIER').map(a => (
                      <option key={a.id} value={`${a.name} (${a.brigade})`}>
                        {a.name} — {a.brigade}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Karim Ben Salem (Chef Ouvrier - Voirie)">Karim Ben Salem — Voirie Centre</option>
                      <option value="Tarek Jouini (Chef Ouvrier - Salubrité)">Tarek Jouini — Salubrité Nord</option>
                      <option value="Brigade Intervention Rapide">Brigade Intervention Rapide</option>
                    </>
                  )}
                </select>
              </div>

              <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] text-xs space-y-1">
                <span className="font-semibold text-[#0f172a]">Conséquence :</span>
                <p className="text-[#64748b]">
                  Le signalement passera au statut <strong>ASSIGNE</strong> et apparaîtra instantanément dans la feuille de route mobile du chef d'équipe sélectionné.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setAssigningReport(null)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!targetWorker}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm disabled:opacity-50"
                >
                  Confirmer le Dispatching
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Nouveau Signalement Direct Municipal */}
      {showAddReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0f172a]">Signalement Municipal Interne</h3>
                <p className="text-xs text-[#64748b]">Enregistré directement par les services de {municipality}</p>
              </div>
              <button onClick={() => setShowAddReportModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <form onSubmit={handleCreateDirectReport} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Titre de l'anomalie</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Débordement conteneur Avenue Principale"
                  value={newReportTitle}
                  onChange={e => setNewReportTitle(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Description / Constat technique</label>
                <textarea
                  rows={3}
                  placeholder="Détails de l'anomalie constatée par les agents municipaux..."
                  value={newReportDesc}
                  onChange={e => setNewReportDesc(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Catégorie</label>
                  <select
                    value={newReportCategory}
                    onChange={e => setNewReportCategory(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  >
                    <option value="DEPOT_SAUVAGE">Dépôt sauvage</option>
                    <option value="ENCOMBRANTS">Objets encombrants</option>
                    <option value="DEBORDEMENT_BAC">Débordement de bacs</option>
                    <option value="DECHETS_DANGEREUX">Déchets dangereux</option>
                    <option value="DECHETS_VERTS">Déchets verts</option>
                    <option value="GRAFFITI">Dégradations & Graffitis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1">Secteur / Quartier</label>
                  <input
                    type="text"
                    required
                    value={newReportDistrict}
                    onChange={e => setNewReportDistrict(e.target.value)}
                    className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowAddReportModal(false)}
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold text-[#475569] hover:bg-[#f1f5f9]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] text-xs font-semibold bg-[#059669] hover:bg-[#047857] text-white shadow-sm"
                >
                  Enregistrer le Signalement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMairieDashboard;
