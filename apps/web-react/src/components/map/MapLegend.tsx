import { STATUS_STYLES } from './markerStyle';
import { MAP_STRINGS, STATUS_LABELS } from './strings.fr';
import { REPORT_STATUSES } from './types';

export function MapLegend() {
  return (
    <section aria-labelledby="supervision-map-legend" className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <h2 id="supervision-map-legend" className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
        {MAP_STRINGS.legendTitle}
      </h2>
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {REPORT_STATUSES.map((status) => {
          const { fill, text, glyph } = STATUS_STYLES[status];
          return (
            <li key={status} className="flex items-center gap-2 text-xs font-medium text-[#0f172a]">
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
