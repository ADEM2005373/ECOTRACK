import { isGuid } from '../config';
import { EffectiveIdentity } from '../rls';
import { AzureAccessTokenProvider } from './azure-token';
import { errorFromStatus, UpstreamError } from './errors';

export const POWERBI_API_BASE = 'https://api.powerbi.com/v1.0/myorg';
const EMBED_HOST = 'app.powerbi.com';

export type FetchFn = (input: string, init: RequestInit) => Promise<Response>;

export interface ReportMetadata {
  embedUrl: string;
  datasetId: string;
}

export interface EmbedToken {
  token: string;
  expiresAt: Date;
}

export interface GenerateTokenRequest {
  reportId: string;
  datasetId: string;
  identity: EffectiveIdentity;
}

export interface PowerBiService {
  getReport(workspaceId: string, reportId: string): Promise<ReportMetadata>;
  generateToken(request: GenerateTokenRequest): Promise<EmbedToken>;
}

export interface PowerBiClientOptions {
  tokenProvider: AzureAccessTokenProvider;
  fetchFn: FetchFn;
  timeoutMs: number;
}

/** Only https URLs on app.powerbi.com are handed to the browser. */
export function isTrustedEmbedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === EMBED_HOST && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** GenerateToken V2 body: view-only by default, so no accessLevel and no allowEdit. */
export function buildGenerateTokenBody(request: GenerateTokenRequest): Record<string, unknown> {
  return {
    reports: [{ id: request.reportId }],
    datasets: [{ id: request.datasetId }],
    identities: [
      {
        username: request.identity.username,
        roles: [...request.identity.roles],
        datasets: [...request.identity.datasets]
      }
    ]
  };
}

export function createPowerBiClient(options: PowerBiClientOptions): PowerBiService {
  async function call(url: string, method: 'GET' | 'POST', jsonBody?: unknown): Promise<unknown> {
    const accessToken = await options.tokenProvider.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`
    };
    if (jsonBody !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    // One deadline for the whole call, response body included.
    const signal = AbortSignal.timeout(options.timeoutMs);
    let response: Response;
    try {
      response = await options.fetchFn(url, {
        method,
        headers,
        body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
        signal
      });
    } catch {
      throw new UpstreamError(signal.aborted ? 'UPSTREAM_TIMEOUT' : 'POWERBI_UNAVAILABLE');
    }
    if (!response.ok) {
      throw errorFromStatus(response.status, response.headers.get('Retry-After'));
    }
    try {
      return await response.json();
    } catch {
      throw new UpstreamError(signal.aborted ? 'UPSTREAM_TIMEOUT' : 'POWERBI_INVALID_RESPONSE', response.status);
    }
  }

  return {
    async getReport(workspaceId, reportId) {
      const body = await call(
        `${POWERBI_API_BASE}/groups/${encodeURIComponent(workspaceId)}/reports/${encodeURIComponent(reportId)}`,
        'GET'
      );
      if (
        !isRecord(body) ||
        typeof body.embedUrl !== 'string' ||
        !isTrustedEmbedUrl(body.embedUrl) ||
        typeof body.datasetId !== 'string' ||
        !isGuid(body.datasetId)
      ) {
        throw new UpstreamError('POWERBI_INVALID_RESPONSE');
      }
      return { embedUrl: body.embedUrl, datasetId: body.datasetId };
    },

    async generateToken(request) {
      const body = await call(`${POWERBI_API_BASE}/GenerateToken`, 'POST', buildGenerateTokenBody(request));
      if (!isRecord(body) || typeof body.token !== 'string' || body.token === '' || typeof body.expiration !== 'string') {
        throw new UpstreamError('POWERBI_INVALID_RESPONSE');
      }
      const expiresAt = new Date(body.expiration);
      if (Number.isNaN(expiresAt.getTime())) {
        throw new UpstreamError('POWERBI_INVALID_RESPONSE');
      }
      return { token: body.token, expiresAt };
    }
  };
}
