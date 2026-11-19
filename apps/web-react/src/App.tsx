import { useState } from 'react';
import { useAuth } from './store/authStore';
import { FigmaSidebar } from './components/layout/FigmaSidebar';
import { CitoyenDashboard } from './components/dashboards/CitoyenDashboard';
import { ChefOuvrierDashboard } from './components/dashboards/ChefOuvrierDashboard';
import { AgentMairieDashboard } from './components/dashboards/AgentMairieDashboard';
import { AdminMairieDashboard } from './components/dashboards/AdminMairieDashboard';
import { AdminSaasDashboard } from './components/dashboards/AdminSaasDashboard';
import { Bell, ChevronRight } from 'lucide-react';

export default function App() {
  const { state: authState } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const user = authState.user;
  const role = user?.role || 'CITOYEN';

  // Rendu conditionnel strict du tableau de bord selon le rôle de l'utilisateur connecté
  const renderRoleDashboard = () => {
    switch (role) {
      case 'CITOYEN':
        return <CitoyenDashboard />;
      case 'CHEF_OUVRIER':
      case 'OUVRIER':
        return <ChefOuvrierDashboard />;
      case 'AGENT_MAIRIE':
      case 'AGENT':
        return <AgentMairieDashboard />;
      case 'ADMIN_MUNICIPALITE':
        return <AdminMairieDashboard />;
      case 'ADMIN_SAAS':
      case 'ADMIN':
      default:
        return <AdminSaasDashboard />;
    }
  };

  const getPageTitle = () => {
    switch (role) {
      case 'CITOYEN':
        return { space: 'Espace Citoyen', page: 'Mes Réclamations & Signalements' };
      case 'CHEF_OUVRIER':
      case 'OUVRIER':
        return { space: 'Espace Terrain', page: 'Feuille de Route & Chantiers' };
      case 'AGENT_MAIRIE':
      case 'AGENT':
        return { space: 'Espace Modération', page: 'Boîte de Réception & Arbitrage IA' };
      case 'ADMIN_MUNICIPALITE':
        return { space: 'Espace Mairie', page: 'Pilotage & Décisionnel Local' };
      case 'ADMIN_SAAS':
      case 'ADMIN':
      default:
        return { space: 'Espace Métropolitain', page: 'Tour de Contrôle SaaS Multi-Collectivités' };
    }
  };

  const pageInfo = getPageTitle();
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* 1. Barre Latérale Gauche Figma (05_Flow_Agent_Web & 06_Flow_Admin_Web) */}
      <FigmaSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 2. Espace de Travail Central Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Figma: Barre Supérieure (Top Navbar) */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{pageInfo.space}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-bold">{pageInfo.page}</span>
          </div>

          {/* Outils & Date & Collectivité */}
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 capitalize hidden md:block">
              {today}
            </span>

            <div className="h-4 w-px bg-slate-800 hidden md:block" />

            <div className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-bold text-white text-[11px]">{user?.fullName || 'Utilisateur'}</span>
              <span className="text-[10px] text-emerald-400 font-mono">({role})</span>
            </div>
          </div>
        </header>

        {/* 3. Contenu Métier Rôle-Spécifique */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderRoleDashboard()}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-[11px] text-slate-400 bg-slate-950">
          EcoTrack V2 • Plateforme Métropolitaine de Salubrité Urbaine & Voirie • Conforme Figma & CDCF V2
        </footer>
      </div>
    </div>
  );
}
