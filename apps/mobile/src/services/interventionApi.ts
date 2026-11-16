import { env } from '../config/env';

export const ROADMAP_PATH = '/api/v1/reports';
export const WORKFLOW_TRANSITION_PATH = '/api/v1/workflow/transition';

export type WorkerReport = {
  id: string;
  category: string;
  description?: string;
  priority?: string;
  status: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  assignedWorkerId?: string;
  assignedTeamId?: string;
  startedAt?: string;
};

type ReportsResponse = { reports?: unknown; message?: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseReport(value: unknown): WorkerReport | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.category !== 'string') {
    return null;
  }

  const location = value.location;
  if (
    !isRecord(location) ||
    location.type !== 'Point' ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2 ||
    typeof location.coordinates[0] !== 'number' ||
    typeof location.coordinates[1] !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    category: value.category,
    description: typeof value.description === 'string' ? value.description : undefined,
    priority: typeof value.priority === 'string' ? value.priority : undefined,
    status: typeof value.status === 'string' ? value.status : '',
    location: {
      type: 'Point',
      coordinates: [location.coordinates[0], location.coordinates[1]],
    },
    assignedWorkerId:
      typeof value.assignedWorkerId === 'string' ? value.assignedWorkerId : undefined,
    assignedTeamId: typeof value.assignedTeamId === 'string' ? value.assignedTeamId : undefined,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
  };
}

function apiUrl(path: string): string {
  return `${env.apiUrl.replace(/\/+$/, '')}${path}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function fetchWorkerRoadmap(
  longitude: number,
  latitude: number,
): Promise<WorkerReport[]> {
  const query = new URLSearchParams({
    status: 'ASSIGNE',
    near: `${longitude},${latitude}`,
  });
  const response = await fetch(`${apiUrl(ROADMAP_PATH)}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const body = (await readJson(response)) as ReportsResponse | null;
  if (!response.ok) {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : 'Impossible de charger la feuille de route.',
    );
  }

  const reports = body && Array.isArray(body.reports) ? body.reports : [];
  return reports.map(parseReport).filter((report): report is WorkerReport => report !== null);
}

export async function startIntervention(reportId: string, actorId?: string): Promise<WorkerReport> {
  const response = await fetch(apiUrl(WORKFLOW_TRANSITION_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      reportId,
      action: 'START_WORK',
      actorRole: 'OUVRIER',
      actorId,
    }),
  });
  const body = await readJson(response);
  if (!response.ok || !isRecord(body) || typeof body.id !== 'string') {
    throw new Error(
      isRecord(body) && typeof body.message === 'string'
        ? body.message
        : 'Impossible de démarrer cette intervention.',
    );
  }
  return parseReport(body) ?? {
    id: reportId,
    category: '',
    status: 'EN_TRAITEMENT',
    location: { type: 'Point', coordinates: [0, 0] },
  };
}
