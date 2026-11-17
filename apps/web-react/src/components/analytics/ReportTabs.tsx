import { useRef, type KeyboardEvent } from 'react';
import { REPORTS, type ReportKey } from './reports';
import { ANALYTICS_STRINGS } from './strings.fr';

export const ANALYTICS_PANEL_ID = 'analytics-report-panel';

export function tabId(key: ReportKey): string {
  return `analytics-tab-${key}`;
}

interface ReportTabsProps {
  selected: ReportKey;
  onSelect(key: ReportKey): void;
}

/** WAI-ARIA tabs: arrow keys, Home and End move the focus and select (automatic activation). */
export function ReportTabs({ selected, onSelect }: ReportTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = REPORTS.length - 1;
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) {
      return;
    }
    event.preventDefault();
    tabRefs.current[target]?.focus();
    onSelect(REPORTS[target].key);
  }

  return (
    <div
      role="tablist"
      aria-label={ANALYTICS_STRINGS.tabListLabel}
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-dark-border px-4"
    >
      {REPORTS.map((report, index) => {
        const isSelected = report.key === selected;
        return (
          <button
            key={report.key}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabId(report.key)}
            aria-selected={isSelected}
            aria-controls={ANALYTICS_PANEL_ID}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(report.key)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={
              'min-h-[44px] whitespace-nowrap border-b-2 px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ' +
              (isSelected ? 'border-emerald-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200')
            }
          >
            {report.label}
          </button>
        );
      })}
    </div>
  );
}
