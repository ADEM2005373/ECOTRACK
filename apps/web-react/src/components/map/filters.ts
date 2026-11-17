import { categoryLabel } from './strings.fr';
import type { MapReport, ReportStatus } from './types';

/** null = no filter on that criterion. */
export interface ReportFilters {
  category: string | null;
  status: ReportStatus | null;
}

export const NO_FILTERS: ReportFilters = { category: null, status: null };

export function hasActiveFilters(filters: ReportFilters): boolean {
  return filters.category !== null || filters.status !== null;
}

/** Client-side filtering: instant, no new request. */
export function filterReports(reports: readonly MapReport[], filters: ReportFilters): MapReport[] {
  return reports.filter(
    (report) =>
      (filters.category === null || report.category === filters.category) &&
      (filters.status === null || report.status === filters.status),
  );
}

/** Distinct categories of the loaded reports, sorted by their French label. */
export function categoryOptions(reports: readonly MapReport[]): string[] {
  return [...new Set(reports.map((report) => report.category))].sort((a, b) =>
    categoryLabel(a).localeCompare(categoryLabel(b), 'fr'),
  );
}
