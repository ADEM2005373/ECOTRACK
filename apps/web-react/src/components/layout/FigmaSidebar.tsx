import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Camera,
  PlusCircle,
  FileText,
  LogOut,
  AlertTriangle,
  Clock,
  HelpCircle
} from 'lucide-react';

interface FigmaSidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const FigmaSidebar: React.FC<FigmaSidebarProps> = ({ currentTab, onSelectTab }) => {
  const { state: authState, logout } = useAuth();
  const location = useLocation();
  const user = authState.user;
  const role = user?.role || 'CITOYEN';

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

  // Navigation stricte par rôle (100% conforme aux flux Figma 05_Flow_Agent_Web et 06_Flow_Admin_Web)
  const getNavItems = () => {
    if (role === 'CITOYEN') {
      return [
        { id: 'my-reports', label: 'Mes Réclamations', icon: <FileText className="w-4 h-4" />, path: '/' },
        { id: 'new-report', label: 'Nouveau Signalement', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, path: '/' },
        { id: 'map', label: 'Carte des Incidents', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
      ];
    }

    if (role === 'CHEF_OUVRIER' || role === 'OUVRIER') {
      return [
        { id: 'missions', label: 'Feuille de Route (Missions)', icon: <Wrench className="w-4 h-4 text-amber-400" />, path: '/', count: '3' },
        { id: 'active-jobs', label: 'Chantiers en cours', icon: <Clock className="w-4 h-4 text-blue-400" />, path: '/' },
        { id: 'proof-upload', label: 'Clôture & Preuve Photo', icon: <Camera className="w-4 h-4 text-emerald-400" />, path: '/' },
        { id: 'map', label: 'Carte des Chantiers', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
      ];
    }

    if (role === 'AGENT_MAIRIE' || role === 'AGENT') {
      return [
        { id: 'inbox', label: 'Boîte de réception', icon: <Inbox className="w-4 h-4" />, path: '/', count: '24' },
        { id: 'qualification', label: 'Atelier de Qualification', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, path: '/agent/qualification' },
        { id: 'map', label: 'Carte opérationnelle', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
        { id: 'alerts', label: 'Alertes prioritaires', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, path: '/' },
      ];
    }

    if (role === 'ADMIN_MUNICIPALITE') {
      return [
        { id: 'overview', label: 'Vue d’ensemble', icon: <Inbox className="w-4 h-4" />, path: '/', count: '14' },
        { id: 'users', label: 'Utilisateurs & Brigades', icon: <Users className="w-4 h-4" />, path: '/' },
        { id: 'categories', label: 'Catégories & Seuils SLA', icon: <Tags className="w-4 h-4" />, path: '/' },
        { id: 'powerbi', label: 'Pilotage & Analyses', icon: <BarChart3 className="w-4 h-4 text-blue-400" />, path: '/admin/analytics' },
        { id: 'map', label: 'Carte opérationnelle', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
      ];
    }

    // ADMIN_SAAS
    return [
      { id: 'overview', label: 'Tour de Contrôle SaaS', icon: <Inbox className="w-4 h-4" />, path: '/', count: '48' },
      { id: 'ai-governance', label: 'Gouvernance IA & MLOps', icon: <Brain className="w-4 h-4 text-purple-400" />, path: '/admin/ai-governance' },
      { id: 'powerbi', label: 'Analyses Multi-Villes', icon: <BarChart3 className="w-4 h-4 text-blue-400" />, path: '/admin/analytics' },
      { id: 'map', label: 'Carte Métropolitaine', icon: <MapPin className="w-4 h-4 text-cyan-400" />, path: '/supervision' },
      { id: 'audit', label: 'Journal d’Audit Immuable', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, path: '/' },
    ];
  };

  const navItems = getNavItems();
  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ET';

  return (
    <aside className="bg-[#102c35] flex flex-col justify-between h-screen w-[240px] px-[16px] py-[24px] shrink-0 text-white select-none z-30">
      <div className="flex flex-col gap-[24px]">
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
        <div className="bg-[#1b4449] rounded-[8px] p-[12px] flex flex-col gap-[4px]">
          <p className="font-semibold text-[13px] text-white leading-tight">
            {user?.municipality || 'Ville de Tunis'}
          </p>
          <p className="text-[#aec5cb] text-[11px] leading-tight">
            {roleConfig.roleSubtitle}
          </p>
        </div>

        {/* Figma: Section Navigation */}
        <div className="flex flex-col gap-[8px]">
          <p className="text-[#aec5cb] text-[10px] font-semibold tracking-[1.2px] uppercase px-[4px]">
            {roleConfig.sectionTitle}
          </p>

          <nav className="flex flex-col gap-[4px]">
            {navItems.map(item => {
              const isActive = (item.path !== '/' && location.pathname === item.path) || 
                               (item.path === '/' && location.pathname === '/' && (!currentTab || currentTab === item.id || (item.id === 'inbox' && currentTab === 'overview')));

              const content = (
                <div
                  className={`flex items-center justify-between h-[44px] px-[12px] rounded-[8px] transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-[#1b4449] text-white font-semibold' 
                      : 'text-[#aec5cb] hover:bg-[#1b4449]/50 hover:text-white font-normal'
                  }`}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                >
                  <div className="flex items-center gap-[10px] min-w-0">
                    <span className="shrink-0 size-[18px] flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="text-[12px] truncate">{item.label}</span>
                  </div>
                  {item.count && (
                    <span className="text-[#6ee7b7] text-[11px] font-semibold shrink-0 ml-2">
                      {item.count}
                    </span>
                  )}
                </div>
              );

              if (item.path.startsWith('/admin') || item.path.startsWith('/agent') || item.path.startsWith('/supervision')) {
                return (
                  <Link key={item.id} to={item.path} className="block">
                    {content}
                  </Link>
                );
              }

              return (
                <div key={item.id}>
                  {content}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Figma: Pied de navigation & Profil */}
      <div className="flex flex-col gap-[16px] pt-[16px] border-t border-[#355259]">
        <div className="flex items-center gap-[10px] px-[8px] text-[#aec5cb] hover:text-white text-[12px] cursor-pointer transition">
          <HelpCircle className="size-[18px]" />
          <span>Centre d'aide & Manuel</span>
        </div>

        <div className="flex items-center justify-between pt-[12px] border-t border-[#1b4449]">
          <div className="flex items-center gap-[10px] min-w-0">
            <div className="bg-[#355259] rounded-full size-[34px] flex items-center justify-center text-white font-semibold text-[11px] shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="font-semibold text-[12px] text-white truncate leading-tight">
                {user?.fullName || 'Utilisateur'}
              </p>
              <p className="text-[#aec5cb] text-[10px] truncate leading-tight">
                {roleConfig.roleLabel}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#aec5cb] hover:text-rose-400 hover:bg-[#1b4449] transition shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
