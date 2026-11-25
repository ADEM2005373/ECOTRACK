import { getMyReports, parseCitizenReport, REPORTS_PATH, submitReport } from '../reportApi';

jest.mock('../../config/env', () => ({ env: { apiUrl: 'http://api.test' } }));

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('parseCitizenReport', () => {
  it('maps MongoDB report fields and statuses accurately', () => {
    const parsed = parseCitizenReport({
      _id: '6b02f1001111222233334402',
      category: 'ENCOMBRANTS',
      description: 'Déchets volumineux Avenue Habib Bourguiba',
      status: 'EN_TRAITEMENT',
      district: 'Centre Zarzouna',
      imageUrl: 'https://img.test/before.jpg',
      completionPhotoUrl: 'https://img.test/after.jpg',
      location: { type: 'Point', coordinates: [9.8685, 37.2642] },
    });

    expect(parsed).toMatchObject({
      id: '6b02f1001111222233334402',
      reference: 'REP-2026-4402',
      category: 'Encombrants',
      status: 'EN_COURS',
      statusLabel: 'Brigade sur place',
      beforePhoto: 'https://img.test/before.jpg',
      afterPhoto: 'https://img.test/after.jpg',
      latitude: 37.2642,
      longitude: 9.8685,
    });
  });

  it('returns null when id is missing', () => {
    expect(parseCitizenReport({ category: 'AUTRE' })).toBeNull();
  });
});

describe('getMyReports', () => {
  it('queries reports filtered by reporterId', async () => {
    reply(200, {
      count: 1,
      reports: [
        {
          id: 'rep-1',
          category: 'DEPOT_SAUVAGE',
          description: 'Gravats sur le trottoir',
          status: 'NOUVEAU',
          imageUrl: 'https://img.test/1.jpg',
          location: { type: 'Point', coordinates: [9.87, 37.26] },
        },
      ],
    });

    const res = await getMyReports('cit-123', 'tok-abc');
    expect(res.kind).toBe('success');
    if (res.kind === 'success') {
      expect(res.data).toHaveLength(1);
      expect(res.data[0]?.status).toBe('NOUVEAU');
    }

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://api.test${REPORTS_PATH}?reporterId=cit-123`);
    expect((init?.headers as Record<string, string>)?.Authorization).toBe('Bearer tok-abc');
  });
});

describe('submitReport', () => {
  it('posts JSON payload matching report-api schema', async () => {
    reply(201, {
      message: 'Signalement créé avec succès',
      report: { id: 'rep-999' },
    });

    const res = await submitReport({
      category: 'GRAFFITI',
      description: 'Tags sur le mur de la bibliothèque municipale',
      latitude: 37.2667,
      longitude: 9.8667,
      photoBase64: 'abc123base64',
      reporterId: 'cit-123',
      token: 'tok-abc',
    });

    expect(res).toEqual({ kind: 'success', reportId: 'rep-999' });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://api.test${REPORTS_PATH}`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      category: 'GRAFFITI',
      description: 'Tags sur le mur de la bibliothèque municipale',
      latitude: 37.2667,
      longitude: 9.8667,
      imageUrl: 'data:image/jpeg;base64,abc123base64',
      reporterId: 'cit-123',
    });
  });
});
