import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
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
  HelpCircle
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
        { id: 'inbox', label: 'Boîte de réception', icon: <Inbox className="w-4 h-4 text-emerald-400" />, path: '/' },
        { id: 'qualification', label: 'Atelier de Qualification', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, path: '/agent/qualification' },
        { id: 'map', label: 'Carte opérationnelle', icon: <MapPin className="w-4 h-4 text-blue-400" />, path: '/supervision' },
      ];
    }

    if (role === 'ADMIN_MUNICIPALITE') {
      return [
        { id: 'overview', label: 'Direction Municipale', icon: <Inbox className="w-4 h-4 text-blue-400" />, path: '/' },
        { id: 'reports', label: 'Signalements & Suivi', icon: <FileText className="w-4 h-4 text-amber-400" />, path: '/?tab=reports' },
        { id: 'users', label: 'Utilisateurs & Brigades', icon: <Users className="w-4 h-4 text-emerald-400" />, path: '/?tab=users' },
        { id: 'categories', label: 'Catégories & Seuils SLA', icon: <Tags className="w-4 h-4 text-purple-400" />, path: '/?tab=categories' },
        { id: 'powerbi', label: 'Pilotage & Analyses', icon: <BarChart3 className="w-4 h-4 text-indigo-400" />, path: '/admin/analytics' },
        { id: 'map', label: 'Carte Territoriale', icon: <MapPin className="w-4 h-4 text-teal-400" />, path: '/supervision' },
        { id: 'audit', label: 'Journal d’Audit Territorial', icon: <ShieldCheck className="w-4 h-4 text-teal-400" />, path: '/admin/audit' },
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
            {role === 'ADMIN_SAAS' || role === 'ADMIN' ? 'Plateforme SaaS Centrale' : (user?.municipality || 'Municipalité de Tunis')}
          </p>
          <p className="text-[#aec5cb] text-[10px] leading-tight">
            {roleConfig.roleSubtitle}
          </p>
        </div>

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
    </aside>
  );
};

export default FigmaSidebar;
