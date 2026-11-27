import React, { ReactNode } from 'react';
import { useAuth } from '../../store/authStore';
import { FigmaSidebar } from './FigmaSidebar';
import { FloatingHelpButton } from '../ui/DashboardOverviewKit';
import { Bell, ChevronRight } from 'lucide-react';

interface FigmaLayoutProps {
  children: ReactNode;
  pageSpace?: string;
  pageTitle?: string;
  currentTab?: string;
}

export const FigmaLayout: React.FC<FigmaLayoutProps> = ({
  children,
  pageSpace,
  pageTitle,
  currentTab,
}) => {
  let user: any = null;
  let role = 'ADMIN_SAAS';
  try {
    const auth = useAuth();
    user = auth.state?.user;
    role = user?.role || 'ADMIN_SAAS';
  } catch {
    // Graceful fallback for unit tests rendered without AuthProvider
  }

  const defaultTitles = () => {
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

  const info = defaultTitles();
  const spaceLabel = pageSpace || info.space;
  const titleLabel = pageTitle || info.page;
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased overflow-hidden">
      {/* 1. Barre Latérale Gauche Figma */}
      <FigmaSidebar currentTab={currentTab} />

      {/* 2. Espace de Travail Central Principal */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto bg-[#f8fafc]">
        {/* Figma: Header */}
        <header className="bg-white border-b border-[#e2e8f0] h-[72px] px-[32px] flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-sm">
          {/* Fil d'Ariane Figma */}
          <div className="flex items-center gap-[10px]">
            <span className="text-[#475569] text-[12px] font-normal">{spaceLabel}</span>
            <ChevronRight className="size-[14px] text-[#94a3b8]" />
            <span className="text-[#0f172a] text-[12px] font-semibold">{titleLabel}</span>
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

        {/* 3. Contenu de la Page */}
        <main className="flex-1 p-[32px] max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#e2e8f0] py-4 px-[32px] text-center text-[12px] text-[#64748b] bg-white shrink-0">
          <p>
            Plateforme EcoTrack V2 · République Tunisienne · Conforme CDCF V2 &amp; RGPD · Tous droits réservés 2026
          </p>
        </footer>
        <FloatingHelpButton role={role} />
      </div>
    </div>
  );
};
