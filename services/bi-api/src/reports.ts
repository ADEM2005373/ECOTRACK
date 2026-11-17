/**
 * Server-side whitelist of the 4 official Power BI reports (US-10).
 * The browser only ever sends one of these keys; the report IDs stay in the
 * server environment.
 */
export const REPORT_KEYS = ['operationnel', 'mlops', 'performance-equipes', 'sla'] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export const REPORT_ID_ENV_VARS: Readonly<Record<ReportKey, string>> = {
  operationnel: 'POWERBI_REPORT_ID_OPERATIONNEL',
  mlops: 'POWERBI_REPORT_ID_MLOPS',
  'performance-equipes': 'POWERBI_REPORT_ID_PERFORMANCE_EQUIPES',
  sla: 'POWERBI_REPORT_ID_SLA'
};

export function isReportKey(value: unknown): value is ReportKey {
  return typeof value === 'string' && (REPORT_KEYS as readonly string[]).includes(value);
}
