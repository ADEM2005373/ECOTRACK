import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SupervisionMap } from '../components/map/SupervisionMap';
import { MAP_STRINGS } from '../components/map/strings.fr';

export default function SupervisionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-dark-bg font-sans text-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-border px-6 py-4">
        <div>
          <h1 className="font-heading text-xl font-bold text-white">{MAP_STRINGS.pageTitle}</h1>
          <p className="text-xs text-slate-400">{MAP_STRINGS.pageSubtitle}</p>
        </div>
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {MAP_STRINGS.backHome}
        </Link>
      </header>
      <main className="w-full flex-1 p-4 sm:p-6">
        <SupervisionMap />
      </main>
    </div>
  );
}
