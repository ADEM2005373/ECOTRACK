/**
 * Intervention API service — Worker/Agent screens.
 * Returns { kind: 'success', data } | { kind: 'error', message } for all calls.
 * Falls back to mock data when the network is unavailable.
 */
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InterventionStatus = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE';

export type Intervention = {
  id: string;
  reference: string;
  category: string;
  description?: string;
  address: string;
  status: InterventionStatus;
  citizenPhotoUri?: string;
  latitude?: number;
  longitude?: number;
  startedAt?: string;
  completedAt?: string;
};

type ApiSuccess<T> = { kind: 'success'; data: T };
type ApiError = { kind: 'error'; message: string };
type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function apiUrl(path: string): string {
  const base = env.apiUrl || 'http://localhost:8080';
  return `${base.replace(/\/+$/, '')}${path}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return null; }
}

function parseIntervention(raw: unknown): Intervention | null {
  if (!isRecord(raw) || typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    reference: typeof raw.reference === 'string' ? raw.reference : `INT-${raw.id.slice(0, 8).toUpperCase()}`,
    category: typeof raw.category === 'string' ? raw.category : 'AUTRE',
    description: typeof raw.description === 'string' ? raw.description : undefined,
    address: typeof raw.address === 'string' ? raw.address : '—',
    status: (typeof raw.status === 'string' ? raw.status : 'EN_ATTENTE') as InterventionStatus,
    citizenPhotoUri: typeof raw.citizenPhotoUri === 'string' ? raw.citizenPhotoUri : undefined,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : undefined,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : undefined,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : undefined,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : undefined,
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_INTERVENTIONS: Intervention[] = [
  {
    id: 'mock-001',
    reference: 'INT-2026-0023',
    category: 'DEPOT_SAUVAGE',
    description: 'Dépôt sauvage de déchets ménagers devant le portail.',
    address: '12 Rue des Lilas, 75011 Paris',
    status: 'EN_ATTENTE',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    id: 'mock-002',
    reference: 'INT-2026-0031',
    category: 'GRAFFITI',
    description: 'Tags sur le mur de l\'école primaire.',
    address: '5 Avenue Victor Hugo, 75016 Paris',
    status: 'EN_COURS',
    latitude: 48.8674,
    longitude: 2.2882,
    startedAt: new Date().toISOString(),
  },
  {
    id: 'mock-003',
    reference: 'INT-2026-0018',
    category: 'ENCOMBRANTS',
    description: 'Vieux canapé abandonné sur le trottoir.',
    address: '8 Rue de la Paix, 75001 Paris',
    status: 'TERMINEE',
    latitude: 48.8698,
    longitude: 2.3310,
    completedAt: new Date(Date.now() - 3600_000).toISOString(),
  },
];

// ─── Existing exports (kept for RoadmapScreen compatibility) ──────────────────

export type WorkerReport = {
  id: string;
  category: string;
  description?: string;
  priority?: string;
  status: string;
  location: { type: 'Point'; coordinates: [number, number] };
  assignedWorkerId?: string;
  assignedTeamId?: string;
  startedAt?: string;
};

export const ROADMAP_PATH = '/api/v1/reports';
export const WORKFLOW_TRANSITION_PATH = '/api/v1/workflow/transition';

function parseReport(value: unknown): WorkerReport | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.category !== 'string') return null;
  const location = value.location;
  if (
    !isRecord(location) ||
    location.type !== 'Point' ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2 ||
    typeof location.coordinates[0] !== 'number' ||
    typeof location.coordinates[1] !== 'number'
  ) return null;
  return {
    id: value.id,
    category: value.category,
    description: typeof value.description === 'string' ? value.description : undefined,
    priority: typeof value.priority === 'string' ? value.priority : undefined,
    status: typeof value.status === 'string' ? value.status : '',
    location: { type: 'Point', coordinates: [location.coordinates[0], location.coordinates[1]] },
    assignedWorkerId: typeof value.assignedWorkerId === 'string' ? value.assignedWorkerId : undefined,
    assignedTeamId: typeof value.assignedTeamId === 'string' ? value.assignedTeamId : undefined,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : undefined,
  };
}

export async function fetchWorkerRoadmap(longitude: number, latitude: number): Promise<WorkerReport[]> {
  const query = new URLSearchParams({ status: 'ASSIGNE', near: `${longitude},${latitude}` });
  const response = await fetch(`${apiUrl(ROADMAP_PATH)}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const body = (await readJson(response)) as { reports?: unknown; message?: unknown } | null;
  if (!response.ok) {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : 'Impossible de charger la feuille de route.');
  }
  const reports = body && Array.isArray((body as { reports?: unknown }).reports) ? (body as { reports: unknown[] }).reports : [];
  return reports.map(parseReport).filter((r): r is WorkerReport => r !== null);
}

// ─── New typed API functions ───────────────────────────────────────────────────

/**
 * GET /api/v1/interventions/assigned
 * Returns the list of interventions assigned to the current worker.
 */
export async function getMyInterventions(token: string): Promise<ApiResult<Intervention[]>> {
  try {
    const res = await fetch(apiUrl('/api/v1/interventions/assigned'), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const body = await readJson(res);
    if (!res.ok) {
      return { kind: 'error', message: isRecord(body) && typeof body.message === 'string' ? body.message : 'Erreur serveur.' };
    }
    const list = Array.isArray(body) ? body : (isRecord(body) && Array.isArray(body.interventions) ? body.interventions : []);
    return { kind: 'success', data: list.map(parseIntervention).filter((i): i is Intervention => i !== null) };
  } catch {
    // Network unavailable — return mock data
    return { kind: 'success', data: MOCK_INTERVENTIONS };
  }
}

/**
 * PATCH /api/v1/interventions/:id/start
 */
export async function startInterventionById(id: string, token: string): Promise<ApiResult<Intervention>> {
  try {
    const res = await fetch(apiUrl(`/api/v1/interventions/${id}/start`), {
      method: 'PATCH',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    const body = await readJson(res);
    if (!res.ok) {
      return { kind: 'error', message: isRecord(body) && typeof body.message === 'string' ? body.message : 'Impossible de démarrer.' };
    }
    const parsed = parseIntervention(body);
    if (!parsed) return { kind: 'error', message: 'Réponse inattendue du serveur.' };
    return { kind: 'success', data: parsed };
  } catch {
    // Mock fallback
    const mock = MOCK_INTERVENTIONS.find((m) => m.id === id);
    if (mock) return { kind: 'success', data: { ...mock, status: 'EN_COURS', startedAt: new Date().toISOString() } };
    return { kind: 'error', message: 'Réseau indisponible.' };
  }
}

/**
 * PATCH /api/v1/interventions/:id/complete
 * Sends after_photo as FormData.
 */
export async function completeIntervention(id: string, photoUri: string, token: string): Promise<ApiResult<Intervention>> {
  try {
    const formData = new FormData();
    const filename = photoUri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    // React Native FormData accepts this format
    formData.append('after_photo', { uri: photoUri, name: filename, type } as unknown as Blob);

    const res = await fetch(apiUrl(`/api/v1/interventions/${id}/complete`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const body = await readJson(res);
    if (!res.ok) {
      return { kind: 'error', message: isRecord(body) && typeof body.message === 'string' ? body.message : 'Impossible de terminer.' };
    }
    const parsed = parseIntervention(body);
    if (!parsed) return { kind: 'error', message: 'Réponse inattendue du serveur.' };
    return { kind: 'success', data: parsed };
  } catch {
    const mock = MOCK_INTERVENTIONS.find((m) => m.id === id);
    if (mock) return { kind: 'success', data: { ...mock, status: 'TERMINEE', completedAt: new Date().toISOString() } };
    return { kind: 'error', message: 'Réseau indisponible.' };
  }
}

/**
 * Legacy startIntervention kept for existing InterventionDetailScreen usage.
 */
export async function startIntervention(reportId: string, actorId?: string): Promise<WorkerReport> {
  const response = await fetch(apiUrl(WORKFLOW_TRANSITION_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ reportId, action: 'START_WORK', actorRole: 'OUVRIER', actorId }),
  });
  const body = await readJson(response);
  if (!response.ok || !isRecord(body) || typeof body.id !== 'string') {
    throw new Error(isRecord(body) && typeof body.message === 'string' ? body.message : 'Impossible de démarrer cette intervention.');
  }
  return parseReport(body) ?? { id: reportId, category: '', status: 'EN_TRAITEMENT', location: { type: 'Point', coordinates: [0, 0] } };
}
