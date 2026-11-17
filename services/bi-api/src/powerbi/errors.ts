export type UpstreamErrorCode =
  | 'AZURE_AUTH_FAILED'
  | 'POWERBI_ACCESS_DENIED'
  | 'REPORT_NOT_FOUND'
  | 'POWERBI_THROTTLED'
  | 'POWERBI_REQUEST_REJECTED'
  | 'POWERBI_UNAVAILABLE'
  | 'POWERBI_INVALID_RESPONSE'
  | 'UPSTREAM_TIMEOUT';

/** Azure AD / Power BI failure. Carries a code and status only, never a Microsoft response body. */
export class UpstreamError extends Error {
  constructor(
    readonly code: UpstreamErrorCode,
    readonly upstreamStatus: number | null = null,
    readonly retryAfterSeconds: number | null = null
  ) {
    super(code);
    this.name = 'UpstreamError';
  }
}

const DEFAULT_RETRY_AFTER_SECONDS = 60;
const MAX_RETRY_AFTER_SECONDS = 3600;

/** Retry-After as delta-seconds (Power BI's format); anything else falls back to a default. */
export function parseRetryAfter(header: string | null): number {
  const seconds = header === null ? NaN : Number(header.trim());
  if (!Number.isInteger(seconds) || seconds < 1) {
    return DEFAULT_RETRY_AFTER_SECONDS;
  }
  return Math.min(seconds, MAX_RETRY_AFTER_SECONDS);
}

/** Maps a non-2xx Power BI REST status to an UpstreamError. */
export function errorFromStatus(status: number, retryAfterHeader: string | null): UpstreamError {
  if (status === 401 || status === 403) {
    return new UpstreamError('POWERBI_ACCESS_DENIED', status);
  }
  if (status === 404) {
    return new UpstreamError('REPORT_NOT_FOUND', status);
  }
  if (status === 429) {
    return new UpstreamError('POWERBI_THROTTLED', status, parseRetryAfter(retryAfterHeader));
  }
  if (status >= 500) {
    return new UpstreamError('POWERBI_UNAVAILABLE', status);
  }
  return new UpstreamError('POWERBI_REQUEST_REJECTED', status);
}

export interface HttpErrorMapping {
  status: number;
  retryAfterSeconds: number | null;
}

/** HTTP status bi-api answers with for each upstream failure (decision 7 of ECO-42). */
export function httpStatusFor(error: UpstreamError): HttpErrorMapping {
  switch (error.code) {
    case 'REPORT_NOT_FOUND':
      return { status: 503, retryAfterSeconds: null };
    case 'POWERBI_THROTTLED':
      return { status: 503, retryAfterSeconds: error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS };
    case 'UPSTREAM_TIMEOUT':
      return { status: 504, retryAfterSeconds: null };
    case 'AZURE_AUTH_FAILED':
    case 'POWERBI_ACCESS_DENIED':
    case 'POWERBI_REQUEST_REJECTED':
    case 'POWERBI_UNAVAILABLE':
    case 'POWERBI_INVALID_RESPONSE':
      return { status: 502, retryAfterSeconds: null };
  }
}
