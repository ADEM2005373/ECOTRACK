import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchReports, parseReport, parseReportsPayload, ReportsApiError, reportsUrl } from '../reportsApi';
import { makeApiReport } from './reportBuilders';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseReport', () => {
  it('keeps only the map fields and never the reporter identity', () => {
    const parsed = parseReport(
      makeApiReport({ reporterName: 'Jane Doe', reporterPhone: '+216 00 000 000', reporterEmail: 'x@y.test' }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(Object.keys(parsed.report).sort()).toEqual(
      ['category', 'createdAt', 'description', 'id', 'photoUrl', 'position', 'status'].sort(),
    );
    const serialized = JSON.stringify(parsed.report);
    for (const secret of ['65a1b2c3d4e5f60718293a4b', 'Jane Doe', '+216', 'x@y.test']) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('converts the location to Leaflet order and parses the date', () => {
    const parsed = parseReport(makeApiReport());
    expect(parsed.ok && parsed.report.position).toEqual([36.8065, 10.1815]);
    expect(parsed.ok && parsed.report.createdAt.toISOString()).toBe('2026-11-10T09:30:00.000Z');
  });

  it('prefers the validated category and the thumbnail', () => {
    const parsed = parseReport(
      makeApiReport({ categoryValidated: 'ENCOMBRANTS', thumbnailUrl: 'https://cdn.example.test/t.webp' }),
    );
    expect(parsed.ok && parsed.report.category).toBe('ENCOMBRANTS');
    expect(parsed.ok && parsed.report.photoUrl).toBe('https://cdn.example.test/t.webp');
  });

  it('drops non-http photo URLs', () => {
    const parsed = parseReport(makeApiReport({ imageUrl: 'javascript:alert(1)' }));
    expect(parsed.ok && parsed.report.photoUrl).toBeNull();
  });

  it.each([
    ['missing location', { location: undefined }],
    ['lat/lng swapped out of range', { location: { type: 'Point', coordinates: [36.8065, 100] } }],
    ['unknown status', { status: 'CLOSED' }],
    ['missing id', { id: '' }],
    ['missing category', { category: undefined }],
    ['invalid date', { createdAt: 'not-a-date' }],
  ])('rejects a report with %s', (_name, overrides) => {
    expect(parseReport(makeApiReport(overrides)).ok).toBe(false);
  });
});

describe('parseReportsPayload', () => {
  it('skips and counts invalid reports without failing', () => {
    const payload = parseReportsPayload([makeApiReport(), makeApiReport({ location: null }), 'garbage']);
    expect(payload.reports).toHaveLength(1);
    expect(payload.skipped).toBe(2);
  });

  it('accepts an empty list', () => {
    expect(parseReportsPayload([])).toEqual({ reports: [], skipped: 0 });
  });

  it('rejects a body that is not an array', () => {
    expect(() => parseReportsPayload({ data: [] })).toThrow(ReportsApiError);
  });
});

describe('fetchReports', () => {
  it('calls GET {base}/reports and parses the list', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([makeApiReport()]));
    vi.stubGlobal('fetch', fetchMock);
    const payload = await fetchReports('/api/v1', new AbortController().signal);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/reports', expect.objectContaining({ signal: expect.anything() }));
    expect(payload.reports).toHaveLength(1);
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [501, 'unavailable'],
    [503, 'unavailable'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'x' }, status)));
    await expect(fetchReports('/api/v1', new AbortController().signal)).rejects.toMatchObject({
      kind,
      httpStatus: status,
    });
  });

  it('maps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchReports('/api/v1', new AbortController().signal)).rejects.toMatchObject({ kind: 'network' });
  });

  it('maps a non-JSON body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 200 })));
    await expect(fetchReports('/api/v1', new AbortController().signal)).rejects.toMatchObject({
      kind: 'invalid_payload',
    });
  });

  it('lets an abort propagate as is', async () => {
    const controller = new AbortController();
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.reject(abortError);
    }));
    await expect(fetchReports('/api/v1', controller.signal)).rejects.toBe(abortError);
  });
});

describe('reportsUrl', () => {
  it('joins without double slashes', () => {
    expect(reportsUrl('http://localhost:8080/api/v1/')).toBe('http://localhost:8080/api/v1/reports');
  });
});
