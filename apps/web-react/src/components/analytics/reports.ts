/** Same whitelist as services/bi-api/src/reports.ts: the browser never sends a raw report ID. */
export const REPORTS = [
  { key: 'operationnel', label: 'Opérationnel' },
  { key: 'mlops', label: 'MLOps' },
  { key: 'performance-equipes', label: 'Performance Équipes' },
  { key: 'sla', label: 'SLA' }
] as const;

export type ReportKey = (typeof REPORTS)[number]['key'];

export function reportLabel(key: ReportKey): string {
  return REPORTS.find((report) => report.key === key)?.label ?? key;
}
