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
  'min-h-[42px] w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-xs text-[#0f172a] ' +
  'focus:outline-none focus:ring-2 focus:ring-[#059669] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

export function FilterBar({ categories, filters, onChange, onReset, disabled = false }: FilterBarProps) {
  const id = useId();
  const categoryId = `${id}-category`;
  const statusId = `${id}-status`;
  const urgencyId = `${id}-urgency`;
  const urgencyHelpId = `${id}-urgency-help`;

  return (
    <fieldset className="grid grid-cols-1 gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
      <legend className="sr-only">{MAP_STRINGS.filtersTitle}</legend>

      <div className="space-y-1.5">
        <label htmlFor={categoryId} className="block text-xs font-semibold text-[#475569]">
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
        <label htmlFor={statusId} className="block text-xs font-semibold text-[#475569]">
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
        <label htmlFor={urgencyId} className="block text-xs font-semibold text-[#475569]">
          {MAP_STRINGS.urgencyLabel}
        </label>
        <select id={urgencyId} className={SELECT_CLASS} disabled aria-describedby={urgencyHelpId} value="">
          <option value="">{MAP_STRINGS.urgencyUnavailableOption}</option>
        </select>
        <p id={urgencyHelpId} className="text-[11px] text-[#94a3b8]">
          {MAP_STRINGS.urgencyUnavailableHelp}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="min-h-[42px] border-[#e2e8f0] text-[#475569] hover:bg-slate-50 text-xs font-semibold md:mb-0"
        icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
        onClick={onReset}
        disabled={disabled || !hasActiveFilters(filters)}
      >
        {MAP_STRINGS.resetFilters}
      </Button>
    </fieldset>
  );
}
