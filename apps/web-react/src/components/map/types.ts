import type { LatLng } from './geo';

/**
 * The 7 values of ReportStatus (packages/shared/src/types/report.ts, ECO-20),
 * in workflow order (ADR-03).
 */
export const REPORT_STATUSES = [
  'NOUVEAU',
  'EN_COURS_DE_VALIDATION',
  'VALIDE',
  'ASSIGNE',
  'EN_TRAITEMENT',
  'RESOLU',
  'REJETE',
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUSES as readonly string[]).includes(value);
}

/**
 * What the supervision map keeps from a report. Built by parseReport():
 * reporter identity and contact data never get into this object.
 */
export interface MapReport {
  id: string;
  status: ReportStatus;
  /** Category validated by an agent, otherwise the one declared by the citizen. */
  category: string;
  description: string | null;
  /** thumbnailUrl if present, otherwise imageUrl; only http(s) URLs are kept. */
  photoUrl: string | null;
  position: LatLng;
  createdAt: Date;
  municipality?: string | null;
  district?: string | null;
  aiConfidenceScore?: number | null;
  aiJustification?: string | null;
  assignedTeamId?: string | null;
  assignedWorkerId?: string | null;
}
