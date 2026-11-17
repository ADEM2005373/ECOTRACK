import { STATUS_STYLES } from './markerStyle';
import { MAP_STRINGS, STATUS_LABELS } from './strings.fr';
import { REPORT_STATUSES } from './types';

export function MapLegend() {
  return (
    <section aria-labelledby="supervision-map-legend" className="rounded-2xl border border-dark-border bg-dark-card p-4">
      <h2 id="supervision-map-legend" className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
        {MAP_STRINGS.legendTitle}
      </h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {REPORT_STATUSES.map((status) => {
          const { fill, text, glyph } = STATUS_STYLES[status];
          return (
            <li key={status} className="flex items-center gap-2 text-sm text-slate-200">
              <span
                aria-hidden="true"
                className="eco-marker eco-marker--legend"
                style={{ backgroundColor: fill, color: text }}
              >
                {glyph}
              </span>
              {STATUS_LABELS[status]}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
