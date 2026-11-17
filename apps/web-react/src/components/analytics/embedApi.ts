import type { ReportKey } from './reports';

export type EmbedApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_configured'
  | 'unavailable'
  | 'network'
  | 'invalid_payload';

export class EmbedApiError extends Error {
  constructor(
    readonly kind: EmbedApiErrorKind,
    readonly httpStatus: number | null = null
  ) {
    super(`embed_api_${kind}${httpStatus ? `_${httpStatus}` : ''}`);
    this.name = 'EmbedApiError';
  }
}

export interface EmbedInfo {
  reportId: string;
  embedUrl: string;
  embedToken: string;
  expiresAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Defence in depth: bi-api already checks it, the page only embeds https://app.powerbi.com. */
export function isTrustedEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'app.powerbi.com';
  } catch {
    return false;
  }
}

/** GET /bi/embed-token answers { reportId, embedUrl, accessToken, expiresAt } (bi-api, SCRUM-53). */
export function parseEmbedResponse(body: unknown): EmbedInfo {
  if (!isRecord(body)) {
    throw new EmbedApiError('invalid_payload');
  }
  const { reportId, embedUrl, accessToken, expiresAt } = body;
  const expiresAtMs = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
  if (
    typeof reportId !== 'string' ||
    reportId === '' ||
    typeof embedUrl !== 'string' ||
    !isTrustedEmbedUrl(embedUrl) ||
    typeof accessToken !== 'string' ||
    accessToken === '' ||
    Number.isNaN(expiresAtMs)
  ) {
    throw new EmbedApiError('invalid_payload');
  }
  return { reportId, embedUrl, embedToken: accessToken, expiresAt: expiresAtMs };
}

export function embedTokenUrl(apiBaseUrl: string, report: ReportKey): string {
  return `${apiBaseUrl}/bi/embed-token?report=${encodeURIComponent(report)}`;
}

async function errorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    return isRecord(body) && typeof body.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

export async function fetchEmbedInfo(
  apiBaseUrl: string,
  report: ReportKey,
  userToken: string,
  signal: AbortSignal
): Promise<EmbedInfo> {
  let response: Response;
  try {
    response = await fetch(embedTokenUrl(apiBaseUrl, report), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${userToken}` },
      cache: 'no-store',
      signal
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new EmbedApiError('network');
  }
  if (response.status === 401) {
    throw new EmbedApiError('unauthorized', 401);
  }
  if (response.status === 403) {
    throw new EmbedApiError('forbidden', 403);
  }
  if (!response.ok) {
    const code = await errorCode(response);
    throw new EmbedApiError(code === 'REPORT_NOT_CONFIGURED' ? 'not_configured' : 'unavailable', response.status);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new EmbedApiError('invalid_payload');
  }
  return parseEmbedResponse(body);
}
