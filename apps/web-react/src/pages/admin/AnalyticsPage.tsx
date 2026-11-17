import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, LogOut } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { readApiBaseUrl } from '../../components/analytics/apiBase';
import { AuthProvider, useAuth } from '../../components/analytics/AuthContext';
import { LoginForm } from '../../components/analytics/LoginForm';
import { ReportEmbed } from '../../components/analytics/ReportEmbed';
import { ANALYTICS_PANEL_ID, ReportTabs, tabId } from '../../components/analytics/ReportTabs';
import type { ReportKey } from '../../components/analytics/reports';
import { ANALYTICS_STRINGS } from '../../components/analytics/strings.fr';

/**
 * "Analytique / Décisionnel" (US-10, ECO-42 / SCRUM-53): the 4 official Power BI
 * reports, embedded with a short-lived embed token from bi-api. Full-viewport flex
 * layout so the report fills the screen without a page scrollbar.
 */
export default function AnalyticsPage() {
  return (
    <AuthProvider>
      <AnalyticsContent apiBaseUrl={readApiBaseUrl(import.meta.env)} />
    </AuthProvider>
  );
}

function AnalyticsContent({ apiBaseUrl }: { apiBaseUrl: string | null }) {
  const { session, signOut } = useAuth();
  const [selected, setSelected] = useState<ReportKey>('operationnel');

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-dark-bg text-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-dark-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            aria-label={ANALYTICS_STRINGS.homeLink}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <BarChart3 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-white">{ANALYTICS_STRINGS.pageTitle}</h1>
            <p className="truncate text-xs text-slate-400">{ANALYTICS_STRINGS.pageSubtitle}</p>
          </div>
        </div>
        {session && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:inline">{ANALYTICS_STRINGS.signedInAs(session.fullName)}</span>
            <Button variant="ghost" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={() => signOut()}>
              {ANALYTICS_STRINGS.logout}
            </Button>
          </div>
        )}
      </header>

      {apiBaseUrl === null ? (
        <p role="alert" className="p-6 text-sm text-red-400">
          {ANALYTICS_STRINGS.errors.missingConfig}
        </p>
      ) : session === null ? (
        <LoginForm apiBaseUrl={apiBaseUrl} />
      ) : (
        <>
          <ReportTabs selected={selected} onSelect={setSelected} />
          <div role="tabpanel" id={ANALYTICS_PANEL_ID} aria-labelledby={tabId(selected)} className="min-h-0 flex-1">
            <ReportEmbed
              key={selected}
              apiBaseUrl={apiBaseUrl}
              reportKey={selected}
              userToken={session.accessToken}
              onUnauthorized={() => signOut('invalid')}
            />
          </div>
        </>
      )}
    </div>
  );
}
