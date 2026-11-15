import { useId } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { hasActiveFilters, type ReportFilters } from './filters';
import { categoryLabel, MAP_STRINGS, STATUS_LABELS } from './strings.fr';
import { isReportStatus, REPORT_STATUSES } from './types';

interface FilterBarProps {
  categories: readonly string[];
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onReset: () => void;
  disabled?: boolean;
}

const SELECT_CLASS =
  'min-h-[44px] w-full rounded-lg border border-dark-borderLight bg-slate-900 px-3 text-sm text-slate-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed disabled:text-slate-400';

export function FilterBar({ categories, filters, onChange, onReset, disabled = false }: FilterBarProps) {
  const id = useId();
  const categoryId = `${id}-category`;
  const statusId = `${id}-status`;
  const urgencyId = `${id}-urgency`;
  const urgencyHelpId = `${id}-urgency-help`;

  return (
    <fieldset className="grid grid-cols-1 gap-4 rounded-2xl border border-dark-border bg-dark-card p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <legend className="sr-only">{MAP_STRINGS.filtersTitle}</legend>

      <div className="space-y-1.5">
        <label htmlFor={categoryId} className="block text-xs font-semibold text-slate-300">
          {MAP_STRINGS.categoryLabel}
        </label>
        <select
          id={categoryId}
          className={SELECT_CLASS}
          value={filters.category ?? ''}
          disabled={disabled}
          onChange={(event) => onChange({ ...filters, category: event.target.value || null })}
        >
          <option value="">{MAP_STRINGS.allOption}</option>
          {categories.map((code) => (
            <option key={code} value={code}>
              {categoryLabel(code)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={statusId} className="block text-xs font-semibold text-slate-300">
          {MAP_STRINGS.statusLabel}
        </label>
        <select
          id={statusId}
          className={SELECT_CLASS}
          value={filters.status ?? ''}
          disabled={disabled}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ ...filters, status: isReportStatus(value) ? value : null });
          }}
        >
          <option value="">{MAP_STRINGS.allStatusesOption}</option>
          {REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={urgencyId} className="block text-xs font-semibold text-slate-300">
          {MAP_STRINGS.urgencyLabel}
        </label>
        <select id={urgencyId} className={SELECT_CLASS} disabled aria-describedby={urgencyHelpId} value="">
          <option value="">{MAP_STRINGS.urgencyUnavailableOption}</option>
        </select>
        <p id={urgencyHelpId} className="text-xs text-slate-400">
          {MAP_STRINGS.urgencyUnavailableHelp}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] md:mb-0"
        icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
        onClick={onReset}
        disabled={disabled || !hasActiveFilters(filters)}
      >
        {MAP_STRINGS.resetFilters}
      </Button>
    </fieldset>
  );
}
