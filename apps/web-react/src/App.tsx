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

  // Rendu conditionnel strict selon le rôle connecté (100% conforme Figma)
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
        return { space: 'Opérations Terrain', page: 'Feuille de Route des Missions' };
      case 'AGENT_MAIRIE':
      case 'AGENT':
        return { space: 'Opérations', page: 'Boîte de Réception & Modération' };
      case 'ADMIN_MUNICIPALITE':
        return { space: 'Administration', page: 'Direction Municipale & Décisionnel' };
      case 'ADMIN_SAAS':
      case 'ADMIN':
      default:
        return { space: 'Administration', page: 'Tour de Contrôle SaaS Multi-Collectivités' };
    }
  };

  const pageInfo = getPageTitle();
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased overflow-hidden">
      {/* 1. Barre Latérale Gauche Figma (05_Flow_Agent_Web & 06_Flow_Admin_Web) */}
      <FigmaSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 2. Espace de Travail Central Principal */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto bg-[#f8fafc]">
        {/* Figma: Barre Supérieure (Header exact Figma) */}
        <header className="bg-white border-b border-[#e2e8f0] h-[72px] px-[32px] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
          {/* Fil d'Ariane Figma */}
          <div className="flex items-center gap-[10px]">
            <span className="text-[#475569] text-[12px] font-normal">{pageInfo.space}</span>
            <ChevronRight className="size-[14px] text-[#94a3b8]" />
            <span className="text-[#0f172a] text-[12px] font-semibold">{pageInfo.page}</span>
          </div>

          {/* Outils & Profil Figma */}
          <div className="flex items-center gap-[20px]">
            <span className="text-[#475569] text-[12px] capitalize hidden md:block">
              {today}
            </span>

            <div className="relative size-[44px] flex items-center justify-center rounded-lg hover:bg-slate-100 transition cursor-pointer text-[#475569]">
              <Bell className="size-[20px]" />
              <span className="absolute top-[10px] right-[10px] size-[6px] rounded-full bg-[#047857]" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-[#e2e8f0] text-xs">
              <span className="size-2 rounded-full bg-[#059669]" />
              <span className="font-semibold text-[#0f172a] text-[12px]">{user?.fullName || 'Utilisateur'}</span>
              <span className="text-[11px] text-[#059669] font-medium">({role})</span>
            </div>
          </div>
        </header>

        {/* 3. Contenu Métier Rôle-Spécifique */}
        <main className="flex-1 p-[32px] max-w-7xl w-full mx-auto">
          {renderRoleDashboard()}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#e2e8f0] py-4 px-[32px] text-center text-[12px] text-[#64748b] bg-white shrink-0">
          Plateforme Métropolitaine EcoTrack V2 • Conforme au Design Figma & CDCF V2
        </footer>
      </div>
    </div>
  );
}
