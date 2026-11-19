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
  Building2,
  AlertTriangle,
  Clock
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

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN_SAAS':
      case 'ADMIN':
        return { label: 'Admin SaaS Global', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '👑' };
      case 'ADMIN_MUNICIPALITE':
        return { label: 'Admin Municipalité', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🏛️' };
      case 'AGENT_MAIRIE':
      case 'AGENT':
        return { label: 'Agent Mairie', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '📋' };
      case 'CHEF_OUVRIER':
      case 'OUVRIER':
        return { label: 'Chef Ouvrier (Terrain)', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '👷' };
      case 'CITOYEN':
      default:
        return { label: 'Citoyen', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '📱' };
    }
  };

  const roleInfo = getRoleLabel();

  // Navigation configurée strictement selon le rôle utilisateur (Figma: 05_Flow_Agent_Web & 06_Flow_Admin_Web)
  const getNavSections = () => {
    if (role === 'CITOYEN') {
      return [
        {
          title: 'Espace Citoyen',
          items: [
            { id: 'my-reports', label: 'Mes Réclamations', icon: <FileText className="w-4 h-4" />, path: '/' },
            { id: 'new-report', label: 'Nouveau Signalement', icon: <PlusCircle className="w-4 h-4 text-emerald-400" />, path: '/' },
            { id: 'map', label: 'Carte des Incidents', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
          ]
        }
      ];
    }

    if (role === 'CHEF_OUVRIER' || role === 'OUVRIER') {
      return [
        {
          title: 'Interventions Terrain',
          items: [
            { id: 'missions', label: 'Feuille de Route (Missions)', icon: <Wrench className="w-4 h-4 text-amber-400" />, path: '/' },
            { id: 'active-jobs', label: 'Chantiers en cours (T3)', icon: <Clock className="w-4 h-4 text-blue-400" />, path: '/' },
            { id: 'proof-upload', label: 'Clôture & Preuve Photo (T4)', icon: <Camera className="w-4 h-4 text-emerald-400" />, path: '/' },
            { id: 'map', label: 'Carte des Chantiers', icon: <MapPin className="w-4 h-4" />, path: '/supervision' },
          ]
        }
      ];
    }

    if (role === 'AGENT_MAIRIE' || role === 'AGENT') {
      return [
        {
          title: 'Modération & Salubrité',
          items: [
            { id: 'inbox', label: 'Boîte de Réception (Inbox)', icon: <Inbox className="w-4 h-4 text-emerald-400" />, path: '/' },
            { id: 'qualification', label: 'Qualification IA (ECO-31)', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, path: '/agent/qualification' },
            { id: 'map', label: 'Carte Opérationnelle GIS', icon: <MapPin className="w-4 h-4 text-blue-400" />, path: '/supervision' },
            { id: 'alerts', label: 'Alertes Prioritaires', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, path: '/' },
          ]
        }
      ];
    }

    if (role === 'ADMIN_MUNICIPALITE') {
      return [
        {
          title: 'Direction Municipale',
          items: [
            { id: 'overview', label: 'Vue d’ensemble Mairie', icon: <Building2 className="w-4 h-4 text-blue-400" />, path: '/' },
            { id: 'powerbi', label: 'Pilotage & KPIs (ECO-42)', icon: <BarChart3 className="w-4 h-4 text-emerald-400" />, path: '/admin/analytics' },
            { id: 'teams', label: 'Agents & Brigades Terrain', icon: <Users className="w-4 h-4 text-purple-400" />, path: '/' },
            { id: 'categories', label: 'Seuils SLA & Types', icon: <Tags className="w-4 h-4 text-amber-400" />, path: '/' },
            { id: 'map', label: 'Carte Territoriale', icon: <MapPin className="w-4 h-4 text-cyan-400" />, path: '/supervision' },
          ]
        }
      ];
    }

    // ADMIN_SAAS ou ADMIN (Global)
    return [
      {
        title: 'Supervision Globale',
        items: [
          { id: 'overview', label: 'Tour de Contrôle SaaS', icon: <Inbox className="w-4 h-4 text-emerald-400" />, path: '/' },
          { id: 'ai-governance', label: 'Gouvernance IA (ECO-43)', icon: <Brain className="w-4 h-4 text-purple-400" />, path: '/admin/ai-governance' },
          { id: 'powerbi', label: 'Power BI Multi-Villes (ECO-42)', icon: <BarChart3 className="w-4 h-4 text-blue-400" />, path: '/admin/analytics' },
          { id: 'map', label: 'Carte Métropolitaine (ECO-33)', icon: <MapPin className="w-4 h-4 text-cyan-400" />, path: '/supervision' },
          { id: 'audit', label: 'Journal d’Audit Immuable', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, path: '/' },
        ]
      }
    ];
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen text-slate-200 select-none">
      <div>
        {/* Figma: ECOTRACK Logo Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight font-heading text-white flex items-center gap-1.5">
              <span>ECOTRACK</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">V2</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-sans">Smart City Municipal Platform</p>
          </div>
        </div>

        {/* Figma: Territoire & Collectivité Badge */}
        <div className="mx-3.5 my-3.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="uppercase tracking-wider font-semibold">Collectivité</span>
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="font-bold text-white text-xs truncate">
            {user?.municipality || 'Supervision Métropolitaine'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${roleInfo.badge}`}>
              {roleInfo.icon} {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Figma: Navigation Sections */}
        <nav className="px-3 space-y-4 mt-2">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <p className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                {sec.title}
              </p>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = (item.path !== '/' && location.pathname.startsWith(item.path)) ||
                    (item.path === '/' && location.pathname === '/' && (!currentTab || currentTab === item.id));

                  if (item.path !== '/' && item.path !== location.pathname) {
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab && onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Figma: Profil Footer & Logout */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0">
              {user?.fullName ? user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Utilisateur'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
