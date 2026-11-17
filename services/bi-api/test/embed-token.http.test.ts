import { UpstreamError, UpstreamErrorCode } from '../src/powerbi/errors';
import { buildEffectiveIdentity, rlsRolesFor, rlsUsername } from '../src/rls';
import {
  captureLogger,
  DATASET_ID,
  EMBED_TOKEN,
  EMBED_URL,
  fakePowerBi,
  NOW_MS,
  otherKeys,
  REPORT_ID,
  RunningApp,
  signJwt,
  startApp,
  testConfig,
  validClaims
} from './helpers';

const ADMIN_TOKEN = signJwt(validClaims());
const ENDPOINT = '/api/v1/bi/embed-token';

describe('GET /api/v1/bi/embed-token', () => {
  let app: RunningApp;
  let powerBi: ReturnType<typeof fakePowerBi>;
  let log: ReturnType<typeof captureLogger>;
  let consoleSpies: jest.SpyInstance[];

  async function boot(config = testConfig()): Promise<void> {
    await app?.close();
    app = await startApp(powerBi, log.logger, config);
  }

  function get(query: string, token: string | null = ADMIN_TOKEN, init: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = { ...(init.headers as Record<string, string> | undefined) };
    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${app.baseUrl}${ENDPOINT}${query}`, { ...init, headers });
  }

  beforeEach(async () => {
    powerBi = fakePowerBi();
    log = captureLogger();
    consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation(() => undefined)
    );
    app = await startApp(powerBi, log.logger);
  });

  afterEach(async () => {
    await app.close();
    consoleSpies.forEach((spy) => spy.mockRestore());
  });

  describe('success', () => {
    it('returns only { reportId, embedUrl, accessToken, expiresAt } with Cache-Control: no-store', async () => {
      const res = await get('?report=operationnel');
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(res.headers.get('x-powered-by')).toBeNull();
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toEqual({
        reportId: REPORT_ID,
        embedUrl: EMBED_URL,
        accessToken: EMBED_TOKEN,
        expiresAt: new Date(NOW_MS + 3600_000).toISOString()
      });
      expect(Object.keys(body).sort()).toEqual(['accessToken', 'embedUrl', 'expiresAt', 'reportId']);
    });

    it('requests the whitelisted report and builds the RLS identity from the verified token', async () => {
      await get('?report=operationnel');
      expect(powerBi.getReport).toHaveBeenCalledWith(testConfig().workspaceId, REPORT_ID);
      expect(powerBi.generateToken).toHaveBeenCalledWith({
        reportId: REPORT_ID,
        datasetId: DATASET_ID,
        identity: {
          username: validClaims().sub,
          roles: ['Direction_Generale_DGS'],
          datasets: [DATASET_ID]
        }
      });
    });

    it('ignores identity override attempts in the query, the body and headers', async () => {
      const res = await get(
        '?report=operationnel&username=mayor%40ville.fr&roles=Direction_Generale_DGS&datasets=x&reportId=y',
        signJwt(validClaims({ sub: 'real-sub' })),
        {
          method: 'GET',
          headers: { 'X-Username': 'evil', 'X-Roles': 'Admin' }
        }
      );
      expect(res.status).toBe(200);
      const request = powerBi.generateToken.mock.calls[0][0];
      expect(request.identity.username).toBe('real-sub');
      expect(request.identity.roles).toEqual(['Direction_Generale_DGS']);
      expect(request.identity.datasets).toEqual([DATASET_ID]);
      expect(request.reportId).toBe(REPORT_ID);
    });

    it('has no POST route, so a request body can never carry an identity', async () => {
      const res = await fetch(`${app.baseUrl}${ENDPOINT}?report=operationnel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ identities: [{ username: 'evil', roles: ['X'] }] })
      });
      expect(res.status).toBe(404);
      expect(powerBi.generateToken).not.toHaveBeenCalled();
    });
  });

  describe('authentication (401)', () => {
    it.each([
      ['no Authorization header', null],
      ['a malformed token', 'abc'],
      ['a token without exp', signJwt((({ exp: _e, ...c }) => c)(validClaims()))],
      ['a wrong issuer', signJwt(validClaims({ iss: 'other' }))],
      ['alg none', `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify(validClaims())).toString('base64url')}.`],
      ['alg HS256', signJwt(validClaims(), { alg: 'HS256', typ: 'JWT' })],
      ['a bad signature', signJwt(validClaims(), undefined, otherKeys.privateKey)],
      ['an expired token', signJwt(validClaims({ exp: Math.floor(NOW_MS / 1000) - 5 }))],
      ['a missing sub', signJwt(validClaims({ sub: undefined }))],
      ['a missing role', signJwt(validClaims({ role: undefined }))]
    ])('rejects %s', async (_label, token) => {
      const res = await get('?report=operationnel', token);
      expect(res.status).toBe(401);
      expect(res.headers.get('www-authenticate')).toBe('Bearer');
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' });
      expect(powerBi.getReport).not.toHaveBeenCalled();
    });

    it('rejects a non-Bearer scheme', async () => {
      const res = await fetch(`${app.baseUrl}${ENDPOINT}?report=operationnel`, {
        headers: { Authorization: `Basic ${ADMIN_TOKEN}` }
      });
      expect(res.status).toBe(401);
    });
  });

  describe('authorization and RLS (403, fail closed)', () => {
    it.each(['CITOYEN', 'OUVRIER'])('always refuses %s, even if a map entry exists', async (role) => {
      await boot(testConfig({ rlsRoleMap: { ADMIN: ['Direction_Generale_DGS'], [role]: ['Direction_Generale_DGS'] } }));
      const res = await get('?report=operationnel', signJwt(validClaims({ role })));
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: 'FORBIDDEN' });
      expect(powerBi.getReport).not.toHaveBeenCalled();
      expect(powerBi.generateToken).not.toHaveBeenCalled();
    });

    it.each(['AGENT', 'SUPERADMIN', 'admin'])('refuses the unmapped role %s and never issues a token', async (role) => {
      const res = await get('?report=operationnel', signJwt(validClaims({ role })));
      expect(res.status).toBe(403);
      expect(powerBi.generateToken).not.toHaveBeenCalled();
    });

    it('serves AGENT once it is mapped through the environment', async () => {
      await boot(testConfig({ rlsRoleMap: { ADMIN: ['Direction_Generale_DGS'], AGENT: ['Mairie_Arrondissement'] } }));
      const res = await get('?report=operationnel', signJwt(validClaims({ role: 'AGENT' })));
      expect(res.status).toBe(200);
      expect(powerBi.generateToken.mock.calls[0][0].identity.roles).toEqual(['Mairie_Arrondissement']);
    });

    it('checks the role before the report key', async () => {
      const res = await get('?report=unknown', signJwt(validClaims({ role: 'CITOYEN' })));
      expect(res.status).toBe(403);
    });
  });

  describe('report whitelist', () => {
    it.each(['', '?report=', '?report=unknown', `?report=${REPORT_ID}`, '?report=operationnel&report=sla', '?report[]=sla'])(
      'answers 400 UNKNOWN_REPORT for %p',
      async (query) => {
        const res = await get(query);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'UNKNOWN_REPORT' });
        expect(powerBi.getReport).not.toHaveBeenCalled();
      }
    );

    it.each(['mlops', 'performance-equipes', 'sla'])('answers 503 REPORT_NOT_CONFIGURED for %s without a report ID', async (key) => {
      const res = await get(`?report=${key}`);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: 'REPORT_NOT_CONFIGURED' });
      expect(powerBi.getReport).not.toHaveBeenCalled();
    });
  });

  describe('upstream error mapping', () => {
    it.each<[UpstreamErrorCode, number]>([
      ['POWERBI_ACCESS_DENIED', 502],
      ['AZURE_AUTH_FAILED', 502],
      ['POWERBI_REQUEST_REJECTED', 502],
      ['POWERBI_UNAVAILABLE', 502],
      ['POWERBI_INVALID_RESPONSE', 502],
      ['REPORT_NOT_FOUND', 503],
      ['UPSTREAM_TIMEOUT', 504]
    ])('maps %s to HTTP %i with only the error code', async (code, status) => {
      powerBi.getReport.mockRejectedValue(new UpstreamError(code, 418));
      const res = await get('?report=operationnel');
      expect(res.status).toBe(status);
      expect(res.headers.get('cache-control')).toBe('no-store');
      expect(await res.json()).toEqual({ error: code });
      expect(res.headers.get('retry-after')).toBeNull();
    });

    it('maps throttling to 503 with Retry-After', async () => {
      powerBi.generateToken.mockRejectedValue(new UpstreamError('POWERBI_THROTTLED', 429, 42));
      const res = await get('?report=operationnel');
      expect(res.status).toBe(503);
      expect(res.headers.get('retry-after')).toBe('42');
      expect(await res.json()).toEqual({ error: 'POWERBI_THROTTLED' });
    });

    it('answers 500 INTERNAL_ERROR on an unexpected failure without details', async () => {
      powerBi.getReport.mockRejectedValue(new Error('boom with internal details'));
      const res = await get('?report=operationnel');
      expect(res.status).toBe(500);
      expect(await res.text()).toBe('{"error":"INTERNAL_ERROR"}');
    });
  });

  describe('logging', () => {
    it('never logs the embed token, the user token, the secret or the user identity', async () => {
      await get('?report=operationnel');
      powerBi.getReport.mockRejectedValue(new UpstreamError('POWERBI_ACCESS_DENIED', 403));
      await get('?report=operationnel');
      await get('?report=operationnel', signJwt(validClaims({ role: 'CITOYEN' })));

      const logged = JSON.stringify(log.entries) + JSON.stringify(consoleSpies.map((spy) => spy.mock.calls));
      expect(log.entries.map((entry) => entry.event)).toEqual([
        'embed_token_issued',
        'embed_token_upstream_error',
        'embed_token_forbidden'
      ]);
      for (const secret of [EMBED_TOKEN, ADMIN_TOKEN, 'test-secret-value', validClaims().sub as string, 'admin@example.test']) {
        expect(logged).not.toContain(secret);
      }
    });
  });

  it('exposes GET /health without configuration details', async () => {
    const res = await fetch(`${app.baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'bi-api' });
  });
});

describe('RLS helpers', () => {
  const user = { sub: 'opaque-user-id', role: 'ADMIN' };

  it('uses the opaque sub as the RLS username', () => {
    expect(rlsUsername(user)).toBe('opaque-user-id');
  });

  it('builds the identity for the report dataset only', () => {
    expect(buildEffectiveIdentity(user, ['Direction_Generale_DGS'], DATASET_ID)).toEqual({
      username: 'opaque-user-id',
      roles: ['Direction_Generale_DGS'],
      datasets: [DATASET_ID]
    });
  });

  it('fails closed for denied, unmapped and prototype roles', () => {
    const map = { ADMIN: ['A'], CITOYEN: ['B'], AGENT: [] };
    expect(rlsRolesFor('ADMIN', map)).toEqual(['A']);
    expect(rlsRolesFor('CITOYEN', map)).toBeNull();
    expect(rlsRolesFor('OUVRIER', map)).toBeNull();
    expect(rlsRolesFor('AGENT', map)).toBeNull();
    expect(rlsRolesFor('constructor', map)).toBeNull();
    expect(rlsRolesFor('__proto__', map)).toBeNull();
  });
});
