import {
  fetchWorkerRoadmap,
  ROADMAP_PATH,
  startIntervention,
  WORKFLOW_TRANSITION_PATH,
} from '../interventionApi';
import { env } from '../../config/env';

jest.mock('../../config/env', () => ({ env: { apiUrl: 'http://api.test/' } }));

const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  (env as { apiUrl: string }).apiUrl = 'http://api.test/';
});

describe('fetchWorkerRoadmap', () => {
  it('requests assigned reports near the worker position', async () => {
    reply(200, {
      reports: [{
        id: 'r1',
        category: 'NID_DE_POULE',
        status: 'ASSIGNE',
        location: { type: 'Point', coordinates: [10.18, 36.8] },
      }],
    });

    await expect(fetchWorkerRoadmap(10.18, 36.8)).resolves.toHaveLength(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      `http://api.test${ROADMAP_PATH}?status=ASSIGNE&near=10.18%2C36.8`,
    );
  });
});

describe('startIntervention', () => {
  it('posts the T3 transition with the worker identity', async () => {
    reply(200, {
      id: 'r1',
      category: 'NID_DE_POULE',
      status: 'EN_TRAITEMENT',
      location: { type: 'Point', coordinates: [10.18, 36.8] },
    });

    await expect(startIntervention('r1', 'worker-42')).resolves.toMatchObject({
      id: 'r1',
      status: 'EN_TRAITEMENT',
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe(`http://api.test${WORKFLOW_TRANSITION_PATH}`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({
      reportId: 'r1',
      action: 'START_WORK',
      actorRole: 'OUVRIER',
      actorId: 'worker-42',
    });
  });
});
