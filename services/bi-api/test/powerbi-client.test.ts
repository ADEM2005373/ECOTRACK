import { UpstreamError } from '../src/powerbi/errors';
import {
  buildGenerateTokenBody,
  createPowerBiClient,
  FetchFn,
  isTrustedEmbedUrl
} from '../src/powerbi/powerbi-client';
import { DATASET_ID, EMBED_URL, REPORT_ID, WORKSPACE_ID } from './helpers';

const AAD_TOKEN = 'aad-access-token-for-tests';
const IDENTITY = { username: 'user-sub', roles: ['Direction_Generale_DGS'], datasets: [DATASET_ID] };

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function clientWith(fetchFn: jest.MockedFunction<FetchFn>, timeoutMs = 10_000) {
  return createPowerBiClient({
    tokenProvider: { getAccessToken: jest.fn().mockResolvedValue(AAD_TOKEN) },
    fetchFn,
    timeoutMs
  });
}

async function upstreamErrorOf(promise: Promise<unknown>): Promise<UpstreamError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof UpstreamError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected an UpstreamError');
}

describe('getReport (Get Report In Group)', () => {
  it('calls the documented URL with the Azure AD token and returns embedUrl and datasetId', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(
      jsonResponse(200, { id: REPORT_ID, name: 'Opérationnel', embedUrl: EMBED_URL, datasetId: DATASET_ID, webUrl: 'x' })
    );
    await expect(clientWith(fetchFn).getReport(WORKSPACE_ID, REPORT_ID)).resolves.toEqual({
      embedUrl: EMBED_URL,
      datasetId: DATASET_ID
    });
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`https://api.powerbi.com/v1.0/myorg/groups/${WORKSPACE_ID}/reports/${REPORT_ID}`);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${AAD_TOKEN}`);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    ['an http embedUrl', { embedUrl: EMBED_URL.replace('https:', 'http:'), datasetId: DATASET_ID }],
    ['another host', { embedUrl: 'https://evil.example/reportEmbed', datasetId: DATASET_ID }],
    ['a look-alike host', { embedUrl: 'https://app.powerbi.com.evil.example/r', datasetId: DATASET_ID }],
    ['credentials in the URL', { embedUrl: 'https://user:pw@app.powerbi.com/r', datasetId: DATASET_ID }],
    ['a missing datasetId', { embedUrl: EMBED_URL }],
    ['a non-GUID datasetId', { embedUrl: EMBED_URL, datasetId: 'abc' }],
    ['a non-object body', ['x']]
  ])('rejects %s as POWERBI_INVALID_RESPONSE', async (_label, body) => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(jsonResponse(200, body));
    expect((await upstreamErrorOf(clientWith(fetchFn).getReport(WORKSPACE_ID, REPORT_ID))).code).toBe(
      'POWERBI_INVALID_RESPONSE'
    );
  });
});

describe('generateToken (GenerateToken V2)', () => {
  it('posts the exact V2 body: report, dataset and identities, without accessLevel', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(
      jsonResponse(200, { token: 'embed-token', tokenId: 'id', expiration: '2026-11-17T13:00:00Z' })
    );
    const result = await clientWith(fetchFn).generateToken({ reportId: REPORT_ID, datasetId: DATASET_ID, identity: IDENTITY });

    expect(result.token).toBe('embed-token');
    expect(result.expiresAt.toISOString()).toBe('2026-11-17T13:00:00.000Z');
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.powerbi.com/v1.0/myorg/GenerateToken');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      reports: [{ id: REPORT_ID }],
      datasets: [{ id: DATASET_ID }],
      identities: [{ username: 'user-sub', roles: ['Direction_Generale_DGS'], datasets: [DATASET_ID] }]
    });
    expect(body).not.toHaveProperty('accessLevel');
  });

  it('always includes identities in the body', () => {
    const body = buildGenerateTokenBody({ reportId: REPORT_ID, datasetId: DATASET_ID, identity: IDENTITY });
    expect(body.identities).toHaveLength(1);
  });

  it.each([
    ['no token', { expiration: '2026-11-17T13:00:00Z' }],
    ['an empty token', { token: '', expiration: '2026-11-17T13:00:00Z' }],
    ['no expiration', { token: 't' }],
    ['an invalid expiration', { token: 't', expiration: 'tomorrow' }]
  ])('rejects a response with %s', async (_label, body) => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(jsonResponse(200, body));
    const request = { reportId: REPORT_ID, datasetId: DATASET_ID, identity: IDENTITY };
    expect((await upstreamErrorOf(clientWith(fetchFn).generateToken(request))).code).toBe('POWERBI_INVALID_RESPONSE');
  });
});

describe('Power BI error mapping', () => {
  it.each([
    [401, 'POWERBI_ACCESS_DENIED'],
    [403, 'POWERBI_ACCESS_DENIED'],
    [404, 'REPORT_NOT_FOUND'],
    [400, 'POWERBI_REQUEST_REJECTED'],
    [500, 'POWERBI_UNAVAILABLE'],
    [503, 'POWERBI_UNAVAILABLE']
  ])('maps HTTP %i to %s and keeps no response body', async (status, code) => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(
      jsonResponse(status, { error: { code: 'PowerBIEntityNotFound', message: 'secret details' } })
    );
    const error = await upstreamErrorOf(clientWith(fetchFn).getReport(WORKSPACE_ID, REPORT_ID));
    expect(error.code).toBe(code);
    expect(error.upstreamStatus).toBe(status);
    expect(JSON.stringify(error)).not.toContain('secret details');
    expect(error.message).toBe(code);
  });

  it('maps 429 to POWERBI_THROTTLED with Retry-After', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockResolvedValue(
      jsonResponse(429, {}, { 'Retry-After': '17' })
    );
    const error = await upstreamErrorOf(clientWith(fetchFn).getReport(WORKSPACE_ID, REPORT_ID));
    expect(error.code).toBe('POWERBI_THROTTLED');
    expect(error.retryAfterSeconds).toBe(17);
  });

  it('maps a network failure to POWERBI_UNAVAILABLE', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockRejectedValue(new TypeError('fetch failed'));
    expect((await upstreamErrorOf(clientWith(fetchFn).getReport(WORKSPACE_ID, REPORT_ID))).code).toBe(
      'POWERBI_UNAVAILABLE'
    );
  });

  it('aborts a call that exceeds the timeout and maps it to UPSTREAM_TIMEOUT', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        })
    );
    const error = await upstreamErrorOf(clientWith(fetchFn, 20).getReport(WORKSPACE_ID, REPORT_ID));
    expect(error.code).toBe('UPSTREAM_TIMEOUT');
  });

  it('propagates an Azure AD failure without calling Power BI', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>();
    const client = createPowerBiClient({
      tokenProvider: { getAccessToken: jest.fn().mockRejectedValue(new UpstreamError('AZURE_AUTH_FAILED')) },
      fetchFn,
      timeoutMs: 10_000
    });
    expect((await upstreamErrorOf(client.getReport(WORKSPACE_ID, REPORT_ID))).code).toBe('AZURE_AUTH_FAILED');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('isTrustedEmbedUrl', () => {
  it('accepts the Power BI embed host over https', () => {
    expect(isTrustedEmbedUrl(EMBED_URL)).toBe(true);
  });

  it.each(['javascript:alert(1)', 'not a url', 'https://APP.powerbi.com.evil.example', 'http://app.powerbi.com/x'])(
    'rejects %p',
    (url) => {
      expect(isTrustedEmbedUrl(url)).toBe(false);
    }
  );
});
