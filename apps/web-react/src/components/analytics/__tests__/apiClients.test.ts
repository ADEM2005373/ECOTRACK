import { afterEach, describe, expect, it, vi } from 'vitest';
import { readApiBaseUrl } from '../apiBase';
import { login, LoginError, parseLoginResponse } from '../authApi';
import { EmbedApiError, embedTokenUrl, fetchEmbedInfo, parseEmbedResponse } from '../embedApi';
import { refreshAt, REFRESH_MARGIN_MS } from '../refreshSchedule';

const EMBED_URL = 'https://app.powerbi.com/reportEmbed?reportId=r1&groupId=g1';
const VALID_EMBED = {
  reportId: 'r1',
  embedUrl: EMBED_URL,
  accessToken: 'embed-token',
  expiresAt: '2026-11-17T13:00:00.000Z'
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readApiBaseUrl', () => {
  it('trims the trailing slash and returns null when missing', () => {
    expect(readApiBaseUrl({ VITE_API_BASE_URL: '/api/v1/' })).toBe('/api/v1');
    expect(readApiBaseUrl({ VITE_API_BASE_URL: '  ' })).toBeNull();
    expect(readApiBaseUrl({})).toBeNull();
  });
});

describe('authApi', () => {
  const tokens = {
    accessToken: 'user-jwt',
    refreshToken: 'refresh',
    expiresIn: 900,
    tokenType: 'Bearer',
    user: { id: 'u1', fullName: 'Admin', role: 'ADMIN', email: 'a@b.c' }
  };

  it('keeps only the access token, its expiry, the name and the role', () => {
    expect(parseLoginResponse(tokens, 1_000)).toEqual({
      accessToken: 'user-jwt',
      expiresAt: 901_000,
      fullName: 'Admin',
      role: 'ADMIN'
    });
  });

  it.each([null, {}, { ...tokens, accessToken: '' }, { ...tokens, expiresIn: 0 }, { ...tokens, user: { role: 'ADMIN' } }])(
    'rejects an invalid payload %#',
    (body) => {
      expect(() => parseLoginResponse(body, 0)).toThrow(LoginError);
    }
  );

  it('posts the credentials as JSON to /auth/login', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, tokens));
    await login('/api/v1', 'a@b.c', 'secret');
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/v1/auth/login');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@b.c', password: 'secret' });
  });

  it.each([
    [401, 'invalid_credentials'],
    [400, 'validation'],
    [429, 'rate_limited'],
    [500, 'unavailable']
  ])('maps HTTP %i to %s', async (status, kind) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(status, {}));
    await expect(login('/api/v1', 'a@b.c', 'x')).rejects.toMatchObject({ kind });
  });

  it('maps a network failure to network', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(login('/api/v1', 'a@b.c', 'x')).rejects.toMatchObject({ kind: 'network' });
  });
});

describe('embedApi', () => {
  it('builds the URL from a whitelisted key only', () => {
    expect(embedTokenUrl('/api/v1', 'performance-equipes')).toBe('/api/v1/bi/embed-token?report=performance-equipes');
  });

  it('parses the bi-api response', () => {
    expect(parseEmbedResponse(VALID_EMBED)).toEqual({
      reportId: 'r1',
      embedUrl: EMBED_URL,
      embedToken: 'embed-token',
      expiresAt: Date.parse('2026-11-17T13:00:00.000Z')
    });
  });

  it.each([
    ['an http embedUrl', { ...VALID_EMBED, embedUrl: EMBED_URL.replace('https', 'http') }],
    ['a foreign host', { ...VALID_EMBED, embedUrl: 'https://evil.example/reportEmbed' }],
    ['no token', { ...VALID_EMBED, accessToken: '' }],
    ['an invalid date', { ...VALID_EMBED, expiresAt: 'soon' }],
    ['no reportId', { ...VALID_EMBED, reportId: undefined }]
  ])('rejects %s', (_label, body) => {
    expect(() => parseEmbedResponse(body)).toThrow(EmbedApiError);
  });

  it('sends the user token as a Bearer header, without caching', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, VALID_EMBED));
    await fetchEmbedInfo('/api/v1', 'sla', 'user-jwt', new AbortController().signal);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/v1/bi/embed-token?report=sla');
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer user-jwt');
    expect(init?.cache).toBe('no-store');
  });

  it.each([
    [401, { error: 'UNAUTHORIZED' }, 'unauthorized'],
    [403, { error: 'FORBIDDEN' }, 'forbidden'],
    [503, { error: 'REPORT_NOT_CONFIGURED' }, 'not_configured'],
    [503, { error: 'POWERBI_THROTTLED' }, 'unavailable'],
    [502, { error: 'POWERBI_ACCESS_DENIED' }, 'unavailable'],
    [504, 'not json', 'unavailable']
  ])('maps HTTP %i %j to %s', async (status, body, kind) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(status, body));
    await expect(fetchEmbedInfo('/api/v1', 'sla', 't', new AbortController().signal)).rejects.toMatchObject({ kind });
  });

  it('maps a network failure to network', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(fetchEmbedInfo('/api/v1', 'sla', 't', new AbortController().signal)).rejects.toMatchObject({
      kind: 'network'
    });
  });
});

describe('refreshAt', () => {
  const now = 1_000_000;

  it('refreshes 10 minutes before expiry for a normal token', () => {
    expect(refreshAt(now + 60 * 60_000, now)).toBe(now + 50 * 60_000);
  });

  it('refreshes earlier (half the remaining life) for a short-lived token', () => {
    expect(refreshAt(now + 8 * 60_000, now)).toBe(now + 4 * 60_000);
    expect(refreshAt(now + 2 * REFRESH_MARGIN_MS, now)).toBe(now + REFRESH_MARGIN_MS);
  });

  it('refreshes immediately when the token is already expired', () => {
    expect(refreshAt(now - 1, now)).toBe(now);
  });
});
