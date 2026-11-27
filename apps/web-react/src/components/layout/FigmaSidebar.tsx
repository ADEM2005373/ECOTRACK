import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { EcoTrackLogo } from '../EcoTrackLogo';
import {
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
  Server
} from 'lucide-react';

interface FigmaSidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const FigmaSidebar: React.FC<FigmaSidebarProps> = ({ onSelectTab }) => {
  let user: any = null;
  let role = 'ADMIN_SAAS';
  let logout = () => {};

  try {
    const auth = useAuth();
    user = auth.state?.user;
    role = user?.role || 'ADMIN_SAAS';
    logout = auth.logout;
  } catch {
    // Graceful fallback when outside AuthProvider in isolated tests
  }

  const location = useLocation();
  const navigate = useNavigate();

  const getRoleConfig = () => {
    switch (role) {
      case 'ADMIN_SAAS':
      case 'ADMIN':
        return {
          roleLabel: 'Superviseur SaaS',
          roleSubtitle: 'Supervision Multi-Collectivités',
          sectionTitle: '06 / SUPERVISION GLOBALE'
        };
      case 'ADMIN_MUNICIPALITE':
        return {
          roleLabel: 'Directeur Services Urbains',
          roleSubtitle: 'Direction Générale des Services Urbains',
          sectionTitle: '06 / ADMINISTRATION MUNICIPALE'
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
        { id: 'inbox', label: 'Tableau de bord', icon: <Inbox className="w-4 h-4 text-emerald-600" />, path: '/' },
        { id: 'qualification', label: 'Signalements à vérifier', icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />, path: '/agent/qualification' },
        { id: 'map', label: 'Carte des anomalies', icon: <MapPin className="w-4 h-4 text-blue-600" />, path: '/supervision' },
      ];
    }

    if (role === 'ADMIN_MUNICIPALITE') {
      return [
        { id: 'overview', label: 'Tableau de bord', icon: <Inbox className="w-4 h-4 text-emerald-600" />, path: '/' },
        { id: 'qualification', label: 'Vérification IA & Brigades', icon: <ShieldCheck className="w-4 h-4 text-indigo-600" />, path: '/agent/qualification' },
        { id: 'reports', label: 'Tous les signalements', icon: <FileText className="w-4 h-4 text-amber-600" />, path: '/?tab=reports' },
        { id: 'users', label: 'Mes équipes & Agents', icon: <Users className="w-4 h-4 text-emerald-600" />, path: '/?tab=users' },
        { id: 'categories', label: 'Catégories & Délais SLA', icon: <Tags className="w-4 h-4 text-purple-600" />, path: '/?tab=categories' },
        { id: 'powerbi', label: 'Statistiques & Rapports', icon: <BarChart3 className="w-4 h-4 text-blue-600" />, path: '/admin/analytics' },
        { id: 'map', label: 'Carte de la commune', icon: <MapPin className="w-4 h-4 text-teal-600" />, path: '/supervision' },
        { id: 'audit', label: 'Historique des actions', icon: <ShieldCheck className="w-4 h-4 text-slate-600" />, path: '/admin/audit' },
      ];
    }

    // ADMIN_SAAS : Navigation claire sans jargon excessif en façade
    return [
      { id: 'overview', label: 'Tableau de bord national', icon: <Inbox className="w-4 h-4 text-emerald-600" />, path: '/' },
      { id: 'municipalities', label: 'Mairies inscrites', icon: <Building2 className="w-4 h-4 text-blue-600" />, path: '/?tab=municipalities' },
      { id: 'powerbi', label: 'Statistiques Multi-Villes', icon: <BarChart3 className="w-4 h-4 text-indigo-600" />, path: '/admin/analytics' },
      { id: 'map', label: 'Carte Nationale', icon: <MapPin className="w-4 h-4 text-emerald-600" />, path: '/supervision' },
      { id: 'ai-governance', label: 'Réglages IA Vision', icon: <Brain className="w-4 h-4 text-purple-600" />, path: '/admin/ai-governance' },
      { id: 'infrastructure', label: 'État des serveurs', icon: <Server className="w-4 h-4 text-cyan-600" />, path: '/?tab=infrastructure', count: '11/11' },
      { id: 'alerts', label: 'Alertes système', icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, path: '/?tab=alerts' },
      { id: 'audit', label: 'Historique & Sauvegarde', icon: <ShieldCheck className="w-4 h-4 text-teal-600" />, path: '/admin/audit' },
    ];
  };

  const navItems = getNavItems();
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ET';

  return (
    <aside className="bg-white border-r border-slate-200 flex flex-col justify-between h-screen w-[245px] px-[14px] py-[18px] shrink-0 text-slate-700 select-none z-30 overflow-y-auto">
      <div className="flex flex-col gap-[16px]">
        {/* Logo & Marque ECOTRACK */}
        <div className="flex items-center gap-[10px] px-[8px]">
          <EcoTrackLogo size={34} className="rounded-[9px] shadow-xs" />
          <div className="flex flex-col">
            <span className="font-heading font-bold text-[17px] text-slate-900 tracking-tight leading-tight">
              ECOTRACK
            </span>
            <span className="text-emerald-600 text-[10px] tracking-[1.5px] font-sans font-semibold">
              PORTAIL MUNICIPAL
            </span>
          </div>
        </div>

        {/* Territoire & Collectivité */}
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-[10px] flex flex-col gap-[3px]">
          <p className="font-semibold text-[12px] text-slate-900 leading-tight">
            {role === 'ADMIN_SAAS' || role === 'ADMIN' ? 'Plateforme Nationale' : (user?.municipality || 'Municipalité de Tunis')}
          </p>
          <p className="text-emerald-700 text-[10px] leading-tight">
            {roleConfig.roleSubtitle}
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-col gap-[6px]">
          <p className="text-slate-400 text-[10px] font-semibold tracking-[1px] uppercase px-[6px]">
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
                  className={`flex items-center justify-between h-[38px] px-[10px] rounded-xl transition-colors cursor-pointer ${
                    isMatch
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-[9px] min-w-0">
                    <span className="shrink-0 size-[16px] flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="text-[12px] truncate">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ml-1.5">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pied de navigation & Profil */}
      <div className="flex flex-col gap-[10px] pt-[12px] border-t border-slate-200">
        <div className="flex items-center justify-between pt-[4px]">
          <div className="flex items-center gap-[8px] min-w-0">
            <div className="bg-emerald-600 rounded-full size-[32px] flex items-center justify-center text-white font-semibold text-[11px] shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="font-semibold text-[12px] text-slate-900 truncate leading-tight">
                {user?.fullName || 'Utilisateur'}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-tight">
                {roleConfig.roleLabel}
              </p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Se déconnecter"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FigmaSidebar;
