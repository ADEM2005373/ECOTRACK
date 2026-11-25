import { STATUS_STYLES } from './markerStyle';
import { MAP_STRINGS, STATUS_LABELS } from './strings.fr';
import { REPORT_STATUSES, type ReportStatus } from './types';

export function MapLegend({
  activeStatuses,
  onToggleStatus,
}: {
  activeStatuses?: ReadonlySet<ReportStatus>;
  onToggleStatus?: (status: ReportStatus) => void;
} = {}) {
  return (
    <section aria-labelledby="supervision-map-legend" className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="supervision-map-legend" className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
          {MAP_STRINGS.legendTitle}
        </h2>
        {onToggleStatus && (
          <span className="text-[11px] text-slate-500">Cliquez sur un statut pour filtrer</span>
        )}
      </div>
      <ul className="flex flex-wrap gap-2">
        {REPORT_STATUSES.map((status) => {
          const { fill, text, glyph } = STATUS_STYLES[status];
          const isActive = activeStatuses ? activeStatuses.has(status) : false;
          const isInteractive = typeof onToggleStatus === 'function';
          return (
            <li key={status}>
              <button
                type="button"
                onClick={() => onToggleStatus?.(status)}
                disabled={!isInteractive}
                aria-pressed={isInteractive ? isActive : undefined}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-white text-[#0f172a] hover:bg-slate-50'
                } ${!isInteractive ? 'cursor-default border-transparent px-1' : 'cursor-pointer'}`}
              >
                <span
                  aria-hidden="true"
                  className="eco-marker eco-marker--legend"
                  style={{ backgroundColor: fill, color: text }}
                >
                  {glyph}
                </span>
                <span>{STATUS_LABELS[status]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
