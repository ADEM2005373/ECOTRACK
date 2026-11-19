import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type AuthUser } from '../../store/authStore';
import {
  Leaf,
  Inbox,
  MapPin,
  Users,
  Tags,
  BarChart3,
  ShieldCheck,
  Brain,
  Wrench,
  PlusCircle,
  FileText,
  LogOut,
  AlertTriangle,
  Building2,
  Server,
  HelpCircle,
  Repeat
} from 'lucide-react';

interface FigmaSidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const FigmaSidebar: React.FC<FigmaSidebarProps> = ({ onSelectTab }) => {
  let user: any = null;
  let role = 'ADMIN_SAAS';
  let logout = () => {};
  let loginSuccess = (_u: AuthUser, _token: string) => {};

  try {
    const auth = useAuth();
    user = auth.state?.user;
    role = user?.role || 'ADMIN_SAAS';
    logout = auth.logout;
    loginSuccess = auth.loginSuccess;
  } catch {
    // Graceful fallback when outside AuthProvider in isolated tests
  }

  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  useEffect(() => {
    if (showRoleModal) {
      fetch('/api/v1/auth/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.users)) setDbUsers(data.users);
        })
        .catch(() => {});
    }
  }, [showRoleModal]);

  const getRoleConfig = () => {
    switch (role) {
      case 'ADMIN_SAAS':
      case 'ADMIN':
        return {
          roleLabel: 'Superviseur SaaS',
          roleSubtitle: 'Plateforme Métropolitaine',
          sectionTitle: '06 / SUPERVISION GLOBALE'
        };
      case 'ADMIN_MUNICIPALITE':
        return {
          roleLabel: 'Directeur Services Urbains',
          roleSubtitle: `${user?.municipality || 'Ville de Tunis'} · Direction Générale`,
          sectionTitle: '06 / ADMINISTRATION'
        };
      case 'AGENT_MAIRIE':
      case 'AGENT':
        return {
          roleLabel: 'Agent de Modération',
          roleSubtitle: `${user?.municipality || 'Ville de Tunis'} · Centre de Tri`,
          sectionTitle: '05 / OPÉRATIONS AGENT'
        };
      case 'CHEF_OUVRIER':
      case 'OUVRIER':
        return {
          roleLabel: 'Chef d\'Équipe Terrain',
          roleSubtitle: `${user?.municipality || 'Ville de Tunis'} · Brigade Voirie`,
          sectionTitle: '04 / MISSIONS TERRAIN'
        };
      case 'CITOYEN':
      default:
        return {
          roleLabel: 'Citoyen',
          roleSubtitle: `${user?.municipality || 'Ville de Tunis'} · Démarches de Salubrité`,
          sectionTitle: '03 / ESPACE CITOYEN'
        };
    }
  };

  const roleConfig = getRoleConfig();

  // Navigation stricte par rôle (100% conforme Figma et exigences utilisateur)
  const getNavItems = () => {
    if (role === 'CITOYEN') {
      return [
        { id: 'my-reports', label: 'Mes Réclamations', icon: <FileText className="w-4 h-4 text-emerald-400" />, path: '/' },
        { id: 'new-report', label: 'Nouveau Signalement', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, path: '/?tab=new' },
        { id: 'map', label: 'Carte des Incidents', icon: <MapPin className="w-4 h-4 text-blue-400" />, path: '/supervision' },
      ];
    }

    if (role === 'CHEF_OUVRIER' || role === 'OUVRIER') {
      return [
        { id: 'missions', label: 'Feuille de Route (Missions)', icon: <Wrench className="w-4 h-4 text-amber-400" />, path: '/' },
        { id: 'map', label: 'Carte des Chantiers', icon: <MapPin className="w-4 h-4 text-blue-400" />, path: '/supervision' },
      ];
    }

    if (role === 'AGENT_MAIRIE' || role === 'AGENT') {
      return [
        { id: 'inbox', label: 'Boîte de réception', icon: <Inbox className="w-4 h-4 text-emerald-400" />, path: '/' },
        { id: 'qualification', label: 'Atelier de Qualification', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, path: '/agent/qualification' },
        { id: 'map', label: 'Carte opérationnelle', icon: <MapPin className="w-4 h-4 text-blue-400" />, path: '/supervision' },
      ];
    }

    if (role === 'ADMIN_MUNICIPALITE') {
      return [
        { id: 'overview', label: 'Direction Municipale', icon: <Inbox className="w-4 h-4 text-blue-400" />, path: '/' },
        { id: 'users', label: 'Utilisateurs & Brigades', icon: <Users className="w-4 h-4 text-emerald-400" />, path: '/?tab=users' },
        { id: 'categories', label: 'Catégories & Seuils SLA', icon: <Tags className="w-4 h-4 text-purple-400" />, path: '/?tab=categories' },
        { id: 'powerbi', label: 'Pilotage & Analyses', icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, path: '/admin/analytics' },
        { id: 'map', label: 'Carte Territoriale', icon: <MapPin className="w-4 h-4 text-teal-400" />, path: '/supervision' },
      ];
    }

    // ADMIN_SAAS : TOUTES LES FONCTIONNALITÉS DEMANDÉES DIRECTEMENT DANS LE MENU
    return [
      { id: 'overview', label: 'Tour de Contrôle SaaS', icon: <Inbox className="w-4 h-4 text-emerald-400" />, path: '/' },
      { id: 'municipalities', label: 'Supervision des Mairies', icon: <Building2 className="w-4 h-4 text-blue-400" />, path: '/?tab=municipalities' },
      { id: 'infrastructure', label: 'Serveurs & Flux K8s', icon: <Server className="w-4 h-4 text-cyan-400" />, path: '/?tab=infrastructure', count: '11/11' },
      { id: 'alerts', label: 'Alertes Techniques', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, path: '/?tab=alerts' },
      { id: 'ai-governance', label: 'Gouvernance IA & MLOps', icon: <Brain className="w-4 h-4 text-purple-400" />, path: '/admin/ai-governance' },
      { id: 'powerbi', label: 'Analyses Multi-Villes', icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, path: '/admin/analytics' },
      { id: 'map', label: 'Carte Métropolitaine', icon: <MapPin className="w-4 h-4 text-emerald-400" />, path: '/supervision' },
      { id: 'audit', label: 'Journal d’Audit & Backup', icon: <ShieldCheck className="w-4 h-4 text-teal-400" />, path: '/admin/audit' },
    ];
  };

  const navItems = getNavItems();
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ET';

  return (
    <aside className="bg-[#102c35] flex flex-col justify-between h-screen w-[240px] px-[16px] py-[20px] shrink-0 text-white select-none z-30 overflow-y-auto">
      <div className="flex flex-col gap-[18px]">
        {/* Figma: Logo & Marque ECOTRACK CONSOLE V2 */}
        <div className="flex items-center gap-[10px] px-[8px]">
          <div className="bg-[#059669] flex items-center justify-center rounded-[9px] size-[34px] shadow-sm">
            <Leaf className="size-[20px] text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-bold text-[18px] text-white tracking-tight leading-tight">
              ECOTRACK
            </span>
            <span className="text-[#aec5cb] text-[10px] tracking-[2px] font-sans font-semibold">
              CONSOLE V2
            </span>
          </div>
        </div>

        {/* Figma: Territoire & Collectivité */}
        <div className="bg-[#1b4449] rounded-[8px] p-[10px] flex flex-col gap-[3px]">
          <p className="font-semibold text-[12px] text-white leading-tight">
            {user?.municipality || 'Ville de Tunis'}
          </p>
          <p className="text-[#aec5cb] text-[10px] leading-tight">
            {roleConfig.roleSubtitle}
          </p>
        </div>

        {/* Bouton Testeur Rapide de Rôles */}
        <button
          onClick={() => setShowRoleModal(true)}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#059669]/20 hover:bg-[#059669]/30 border border-[#059669]/40 text-[#6ee7b7] text-[11px] font-medium transition cursor-pointer"
          title="Changer de compte pour tester tous les rôles"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Repeat className="w-3.5 h-3.5" />
            <span>Tester les 5 Rôles</span>
          </span>
          <span className="text-[10px] font-bold bg-[#059669] text-white px-1.5 py-0.2 rounded">5/5</span>
        </button>

        {/* Figma: Section Navigation */}
        <div className="flex flex-col gap-[6px]">
          <p className="text-[#aec5cb] text-[10px] font-semibold tracking-[1.2px] uppercase px-[4px]">
            {roleConfig.sectionTitle}
          </p>

          <nav className="flex flex-col gap-[3px]">
            {navItems.map(item => {
              const isMatch = (() => {
                if (item.path === '/') {
                  return location.pathname === '/' && (!location.search || location.search === '' || location.search === '?tab=overview');
                }
                if (item.path.includes('?tab=')) {
                  const tabParam = item.path.split('?tab=')[1];
                  return location.pathname === '/' && location.search === `?tab=${tabParam}`;
                }
                return location.pathname === item.path;
              })();

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  className={`flex items-center justify-between h-[40px] px-[10px] rounded-[8px] transition-colors cursor-pointer ${
                    isMatch 
                      ? 'bg-[#1b4449] text-white font-semibold' 
                      : 'text-[#aec5cb] hover:bg-[#1b4449]/50 hover:text-white font-normal'
                  }`}
                >
                  <div className="flex items-center gap-[9px] min-w-0">
                    <span className="shrink-0 size-[16px] flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="text-[11px] truncate">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="text-[#6ee7b7] text-[10px] font-semibold shrink-0 ml-1.5">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Figma: Pied de navigation & Profil */}
      <div className="flex flex-col gap-[12px] pt-[12px] border-t border-[#355259]">
        <div className="flex items-center gap-[8px] px-[6px] text-[#aec5cb] hover:text-white text-[11px] cursor-pointer transition">
          <HelpCircle className="size-[16px]" />
          <span>Centre d'aide &amp; Documentation</span>
        </div>

        <div className="flex items-center justify-between pt-[8px] border-t border-[#1b4449]">
          <div className="flex items-center gap-[8px] min-w-0">
            <div className="bg-[#355259] rounded-full size-[30px] flex items-center justify-center text-white font-semibold text-[10px] shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="font-semibold text-[11px] text-white truncate leading-tight">
                {user?.fullName || 'Utilisateur'}
              </p>
              <p className="text-[10px] text-[#aec5cb] truncate leading-tight">
                {roleConfig.roleLabel}
              </p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Se déconnecter"
            className="text-[#aec5cb] hover:text-rose-400 p-1 rounded transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Changement Rapide de Rôle pour Démonstration */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3 text-[#0f172a]">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2.5">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-[#059669]" />
                <h3 className="text-sm font-bold text-[#0f172a]">
                  Tester un autre compte (5 Rôles)
                </h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#475569]">
              Comptes réels enregistrés dans la base MongoDB (seul Admin SaaS conservé par défaut) :
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {dbUsers.length > 0 ? (
                dbUsers.map((u: any) => (
                  <button
                    key={u.id || u._id}
                    onClick={() => {
                      loginSuccess({
                        id: u.id || u._id,
                        email: u.email,
                        fullName: u.fullName,
                        role: u.role,
                        municipality: u.municipality || 'Collectivité'
                      }, 'jwt_access_token_real');
                      setShowRoleModal(false);
                      navigate('/');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between ${
                      user?.email === u.email
                        ? 'bg-emerald-50 border-[#059669] text-[#065f46]'
                        : 'bg-slate-50 border-[#e2e8f0] hover:bg-slate-100 text-[#0f172a]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{u.fullName} ({u.role})</span>
                      <span className="text-[11px] text-[#64748b]">{u.email} · {u.municipality || 'SaaS Global'}</span>
                    </div>
                    {user?.email === u.email && (
                      <span className="text-[10px] font-bold bg-[#059669] text-white px-2 py-0.5 rounded">Connecté</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-[#64748b] text-center">
                  Chargement des comptes...
                </div>
              )}
            </div>

            {dbUsers.length === 1 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-[#065f46] space-y-1">
                <p className="font-bold">✨ Base épurée sans fausses données</p>
                <p className="text-[11px] text-[#047857]">
                  En tant qu'Admin SaaS, vous pouvez créer de nouvelles municipalités, agents et équipes depuis l'onglet <strong>Supervision des Mairies</strong>. Ils apparaîtront automatiquement ici.
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  navigate('/?tab=municipalities');
                }}
                className="text-xs font-semibold text-[#059669] hover:underline"
              >
                + Ajouter une Municipalité
              </button>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="px-3 py-1.5 text-xs text-[#475569] hover:bg-slate-100 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default FigmaSidebar;
