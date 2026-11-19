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
  UserPlus
} from 'lucide-react';

export const AdminMairieDashboard: React.FC = () => {
  const { state: authState } = useAuth();
  const municipality = authState.user?.municipality || 'Municipalité de Tunis';

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab') as 'overview' | 'users' | 'categories' | null;

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'categories'>(
    currentTabParam && ['overview', 'users', 'categories'].includes(currentTabParam)
      ? currentTabParam
      : 'overview'
  );

  useEffect(() => {
    if (currentTabParam && ['overview', 'users', 'categories'].includes(currentTabParam)) {
      setActiveTab(currentTabParam);
    } else if (!currentTabParam) {
      setActiveTab('overview');
    }
  }, [currentTabParam]);

  const switchTab = (tab: 'overview' | 'users' | 'categories') => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // Liste des agents & brigades de la municipalité (chargée depuis la base MongoDB)
  const [agents, setAgents] = useState<any[]>([]);

  const fetchAgents = () => {
    fetch('/api/v1/auth/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.users)) {
          const list = data.users
            .filter((u: any) => u.role === 'AGENT_MAIRIE' || u.role === 'CHEF_OUVRIER' || u.role === 'OUVRIER')
            .map((u: any) => ({
              id: u.id,
              name: u.fullName,
              email: u.email,
              role: u.role,
              active: u.isActive,
              assignedQueue: 0,
              brigade: u.role === 'CHEF_OUVRIER' ? 'Voirie & Salubrité' : 'Pôle Modération'
            }));
          setAgents(list);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Types et Seuils SLA locaux (Figma: WEB_ADM_02_CATEGORIES)
  const [categories] = useState([
    { slug: 'DEPOT_SAUVAGE', label: 'Dépôts sauvages', defaultSeverity: 'Élevée', slaHours: 24, brigade: 'Voirie & Salubrité' },
    { slug: 'ENCOMBRANTS', label: 'Objets encombrants', defaultSeverity: 'Moyenne', slaHours: 48, brigade: 'Ramassage Poids Lourd' },
    { slug: 'DECHETS_DANGEREUX', label: 'Déchets dangereux', defaultSeverity: 'Critique', slaHours: 12, brigade: 'Intervention Spéciale' },
    { slug: 'GRAFFITI', label: 'Dégradations & Graffitis', defaultSeverity: 'Faible', slaHours: 72, brigade: 'Peinture & Nettoyage' },
  ]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('AGENT_MAIRIE');

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
      fetchAgents();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Admin Municipalité (Figma: WEB_ADM_01_USERS) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#0f172a] font-heading tracking-tight">
            Direction Municipale
          </h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            {municipality} · Pilotage stratégique des services urbains, respect des délais d'intervention (SLA) et gestion des équipes.
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

      {/* Onglets de navigation interne (Figma: Users / Categories / KPIs) */}
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-2">
        <button
          onClick={() => switchTab('overview')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition ${
            activeTab === 'overview'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          Vue d'ensemble & KPIs
        </button>
        <button
          onClick={() => switchTab('users')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition ${
            activeTab === 'users'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          Utilisateurs & Brigades ({agents.length})
        </button>
        <button
          onClick={() => switchTab('categories')}
          className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold transition ${
            activeTab === 'categories'
              ? 'bg-[#102c35] text-white'
              : 'text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'
          }`}
        >
          Catégories & Seuils SLA ({categories.length})
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
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">94.2%</div>
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
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">26.4 h</div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">Conforme SLA communal (&lt; 48h)</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Agents & Brigades Actifs</span>
                <Users className="w-4 h-4 text-[#7c3aed]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">{agents.length}</div>
              <p className="text-[11px] text-[#475569] mt-1">1 modérateur · 3 chefs d'équipe</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] p-5 rounded-[12px] shadow-sm">
              <div className="flex items-center justify-between text-[12px] text-[#475569]">
                <span>Alertes Dépassement SLA</span>
                <AlertTriangle className="w-4 h-4 text-[#d97706]" />
              </div>
              <div className="text-[28px] font-bold text-[#0f172a] mt-2 font-heading">0</div>
              <p className="text-[11px] text-[#059669] font-medium mt-1">Aucune réclamation en retard critique</p>
            </div>
          </div>

          {/* Synthèse Opérationnelle & Cartographie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#e2e8f0] p-6 rounded-[12px] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0f172a]">Performance par Arrondissement</h3>
                <span className="text-xs text-[#059669] font-semibold">Mise à jour en temps réel</span>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Centre-Ville', score: 96, count: 18, delay: '18h' },
                  { name: 'El Menzah', score: 94, count: 12, delay: '24h' },
                  { name: 'Bab Bhar', score: 91, count: 9, delay: '29h' },
                  { name: 'La Marsa / Berges', score: 98, count: 6, delay: '14h' },
                ].map(d => (
                  <div key={d.name} className="flex items-center justify-between p-3 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] text-xs">
                    <div>
                      <span className="font-semibold text-[#0f172a]">{d.name}</span>
                      <p className="text-[#64748b] text-[11px]">{d.count} interventions clôturées</p>
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
              <h3 className="text-base font-bold text-[#0f172a]">Ressources Décisionnelles</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                EcoTrack fournit un entrepôt de données décisionnel avec Row-Level Security (RLS) pour isoler les données de chaque municipalité tout en permettant les audits métropolitains.
              </p>
              <div className="p-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-[8px] text-xs space-y-2">
                <p className="font-semibold text-[#1e3a8a]">Connecteur Décisionnel Power BI</p>
                <p className="text-[#3b82f6]">
                  Générez un jeton d'intégration RLS filtré sur la municipalité de <strong>{municipality}</strong> pour vos rapports exécutifs.
                </p>
                <Link
                  to="/admin/analytics"
                  className="inline-flex items-center gap-1.5 text-[#1e3a8a] font-bold text-xs underline mt-1"
                >
                  Accéder à l'espace décisionnel →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ONGLET 2 : UTILISATEURS & BRIGADES (Figma: WEB_ADM_01_USERS) ================= */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Personnel & Brigades Municipales</h3>
              <p className="text-xs text-[#475569]">Gérez les comptes autorisés à modérer ou intervenir sur le territoire communal.</p>
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
                      <p className="font-semibold text-sm text-[#0f172a]">Aucun collaborateur dans cette brigade</p>
                      <p className="text-xs text-[#64748b] mt-1">
                        Cliquez sur "Ajouter un Collaborateur" pour enregistrer un agent de modération ou un chef ouvrier.
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
                        {a.brigade || 'Centre de modération'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[#059669] font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> Actif
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button className="text-[#1e3a8a] hover:underline font-semibold text-xs">
                          Modifier
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

      {/* ================= ONGLET 3 : CATÉGORIES & SLA (Figma: WEB_ADM_02_CATEGORIES) ================= */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-[#e2e8f0] rounded-[12px] shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Configuration des Catégories & Seuils SLA</h3>
              <p className="text-xs text-[#475569]">Définissez les délais légaux de prise en charge et les brigades par défaut.</p>
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] text-[#475569] font-semibold border-b border-[#e2e8f0] h-[40px]">
                  <th className="py-2.5 px-4">Type d'Anomalie</th>
                  <th className="py-2.5 px-4">Sévérité Initiale</th>
                  <th className="py-2.5 px-4">Délai Max (SLA)</th>
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
                      <button className="text-[#1e3a8a] hover:underline font-semibold text-xs">
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

      {/* Modal Ajout Utilisateur */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <h3 className="text-base font-bold text-[#0f172a]">Nouveau Collaborateur Municipal</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-[#94a3b8] hover:text-[#0f172a]">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Moncef Ben Ali"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  placeholder="moncef@mairie.tn"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Mot de passe de connexion</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="•••••••• (min. 8 caractères, ex: Agent2026!)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1">Rôle opérationnel</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full bg-white border border-[#e2e8f0] rounded-[8px] p-2.5 text-xs text-[#0f172a]"
                >
                  <option value="AGENT_MAIRIE">Agent Mairie (Modérateur & Qualification)</option>
                  <option value="CHEF_OUVRIER">Chef Ouvrier (Missions Terrain)</option>
                  <option value="OUVRIER">Ouvrier Technique (Exécution)</option>
                </select>
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
    </div>
  );
};
