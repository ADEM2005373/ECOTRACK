import { geoJsonPointToLatLng } from './geo';
import { isReportStatus, type MapReport } from './types';

export type ReportsApiErrorKind = 'unauthorized' | 'unavailable' | 'network' | 'invalid_payload';

export class ReportsApiError extends Error {
  constructor(
    readonly kind: ReportsApiErrorKind,
    readonly httpStatus: number | null = null,
  ) {
    super(`reports_api_${kind}${httpStatus ? `_${httpStatus}` : ''}`);
    this.name = 'ReportsApiError';
  }
}

export interface ReportsPayload {
  reports: MapReport[];
  /** Reports left out because their location or required fields are invalid. */
  skipped: number;
}

export type ParsedReport = { ok: true; report: MapReport } | { ok: false };

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/** Keeps http(s) URLs only (a photo URL comes from the API, it is not trusted). */
function safeHttpUrl(value: unknown): string | null {
  const raw = nonEmptyString(value);
  if (raw === null) {
    return null;
  }
  try {
    const url = new URL(raw, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * One item of GET /reports (Report JSON of report.schema.ts, ECO-20) -> MapReport.
 * Only the fields the map needs are copied: reporterId and any other personal
 * data are dropped here and never reach the component state.
 */
export function parseReport(raw: unknown): ParsedReport {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false };
  }
  const item = raw as Record<string, unknown>;
  const id = nonEmptyString(item.id);
  const category = nonEmptyString(item.categoryValidated) ?? nonEmptyString(item.category);
  const position = geoJsonPointToLatLng(item.location);
  const createdAt = typeof item.createdAt === 'string' ? new Date(item.createdAt) : null;
  if (
    id === null ||
    category === null ||
    position === null ||
    !isReportStatus(item.status) ||
    createdAt === null ||
    Number.isNaN(createdAt.getTime())
  ) {
    return { ok: false };
  }
  return {
    ok: true,
    report: {
      id,
      status: item.status,
      category,
      description: nonEmptyString(item.description),
      photoUrl: safeHttpUrl(item.thumbnailUrl) ?? safeHttpUrl(item.imageUrl),
      position,
      createdAt,
    },
  };
}

/** GET /reports returns an array of Report (packages/contracts/openapi.yaml). */
export function parseReportsPayload(body: unknown): ReportsPayload {
  if (!Array.isArray(body)) {
    throw new ReportsApiError('invalid_payload');
  }
  const reports: MapReport[] = [];
  let skipped = 0;
  for (const item of body) {
    const parsed = parseReport(item);
    if (parsed.ok) {
      reports.push(parsed.report);
    } else {
      skipped += 1;
    }
  }
  return { reports, skipped };
}

export function reportsUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/reports`;
}

/** Loads every report once; filtering is then done client-side. */
export async function fetchReports(apiBaseUrl: string, signal: AbortSignal): Promise<ReportsPayload> {
  let response: Response;
  try {
    response = await fetch(reportsUrl(apiBaseUrl), {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new ReportsApiError('network');
  }
  if (response.status === 401 || response.status === 403) {
    throw new ReportsApiError('unauthorized', response.status);
  }
  if (!response.ok) {
    throw new ReportsApiError('unavailable', response.status);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new ReportsApiError('invalid_payload');
  }
  return parseReportsPayload(body);
}
