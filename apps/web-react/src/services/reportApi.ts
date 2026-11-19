// Report API service — ECO-20 / Report-API
// Uses native fetch with Bearer token from localStorage.
// Falls back to mock data if the API is unavailable so the UI always works.

const API_BASE = '/api/v1';
const TOKEN_KEY = 'ecotrack_access_token';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReportStats {
  total: number;
  resolved: number;
  inProgress: number;
  averageLatencyMs: number;
  aiF1Score: number;
  resolutionRate: number;
}

export interface ReportItem {
  id: string;
  reference: string;
  title: string;
  category: 'DECHARGE_SAUVAGE' | 'ENCOMBRANTS' | 'GRAFFITI' | 'DEPOT_SAUVAGE' | 'AUTRE';
  district: string;
  status: 'NOUVEAU' | 'A_QUALIFIER' | 'EN_TRAITEMENT' | 'RESOLU' | 'REJETE';
  confidence: number;
  timeAgo: string;
  worker?: string;
  imageUrl: string;
}

// ── Mock fallback data ─────────────────────────────────────────────────────────

export const MOCK_STATS: ReportStats = {
  total: 0,
  resolved: 0,
  inProgress: 0,
  averageLatencyMs: 0,
  aiF1Score: 0,
  resolutionRate: 0,
};

export const MOCK_REPORTS: ReportItem[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a raw API report item to the ReportItem shape. */
function normalizeReport(raw: Record<string, unknown>, idx: number): ReportItem {
  const statusMap: Record<string, ReportItem['status']> = {
    NOUVEAU: 'NOUVEAU',
    EN_COURS_DE_VALIDATION: 'A_QUALIFIER',
    VALIDE: 'A_QUALIFIER',
    ASSIGNE: 'EN_TRAITEMENT',
    EN_TRAITEMENT: 'EN_TRAITEMENT',
    RESOLU: 'RESOLU',
    REJETE: 'REJETE',
  };

  const categoryMap: Record<string, ReportItem['category']> = {
    DECHARGE_SAUVAGE: 'DECHARGE_SAUVAGE',
    ENCOMBRANTS: 'ENCOMBRANTS',
    GRAFFITI: 'GRAFFITI',
    DEPOT_SAUVAGE: 'DEPOT_SAUVAGE',
    DECHETS_DANGEREUX: 'AUTRE',
    VEGETAUX: 'AUTRE',
    AUTRE: 'AUTRE',
  };

  const rawStatus = String(raw.status ?? '');
  const rawCategory = String(raw.categoryValidated ?? raw.category ?? '');
  const createdAt = raw.createdAt ? new Date(String(raw.createdAt)) : null;

  const timeAgo = createdAt
    ? (() => {
        const diffMs = Date.now() - createdAt.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `Il y a ${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `Il y a ${hrs} h`;
        return `Il y a ${Math.floor(hrs / 24)} j`;
      })()
    : 'Récemment';

  return {
    id: String(raw.id ?? `api_${idx}`),
    reference: String(raw.reference ?? `REP-${idx}`),
    title: String(raw.description ?? raw.title ?? 'Anomalie signalée'),
    category: categoryMap[rawCategory] ?? 'AUTRE',
    district: String(raw.district ?? raw.quartier ?? 'Non renseigné'),
    status: statusMap[rawStatus] ?? 'NOUVEAU',
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.9,
    timeAgo,
    worker: raw.workerName ? String(raw.workerName) : undefined,
    imageUrl: String(raw.thumbnailUrl ?? raw.imageUrl ?? ''),
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

export type ApiResult<T> =
  | { kind: 'live'; data: T }
  | { kind: 'mock'; data: T };

/** GET /api/v1/reports/stats */
export async function getStats(): Promise<ApiResult<ReportStats>> {
  try {
    const res = await fetch(`${API_BASE}/reports/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const data: ReportStats = {
      total: Number(raw.total ?? MOCK_STATS.total),
      resolved: Number(raw.resolved ?? MOCK_STATS.resolved),
      inProgress: Number(raw.inProgress ?? raw.in_progress ?? MOCK_STATS.inProgress),
      averageLatencyMs: Number(raw.averageLatencyMs ?? raw.average_latency_ms ?? MOCK_STATS.averageLatencyMs),
      aiF1Score: Number(raw.aiF1Score ?? raw.ai_f1_score ?? MOCK_STATS.aiF1Score),
      resolutionRate: Number(raw.resolutionRate ?? raw.resolution_rate ?? MOCK_STATS.resolutionRate),
    };
    return { kind: 'live', data };
  } catch {
    return { kind: 'mock', data: MOCK_STATS };
  }
}

/** GET /api/v1/reports with optional query params */
export async function getReports(
  filters?: { district?: string; status?: string },
): Promise<ApiResult<ReportItem[]>> {
  try {
    const params = new URLSearchParams();
    if (filters?.district && filters.district !== 'TOUS') params.set('district', filters.district);
    if (filters?.status && filters.status !== 'TOUS') params.set('status', filters.status);
    const qs = params.toString();
    const url = `${API_BASE}/reports${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw: any = await res.json();
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.reports)
      ? raw.reports
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
      ? raw.items
      : [];

    const data: ReportItem[] = list.map((item, idx) =>
      normalizeReport(item as Record<string, unknown>, idx),
    );
    return { kind: 'live', data };
  } catch {
    // Apply client-side filter on mock data
    let data = MOCK_REPORTS;
    if (filters?.district && filters.district !== 'TOUS') {
      data = data.filter((r) => r.district === filters.district);
    }
    if (filters?.status && filters.status !== 'TOUS') {
      data = data.filter((r) => r.status === filters.status);
    }
    return { kind: 'mock', data };
  }
}

/** PATCH /api/v1/reports/:id/assign */
export async function assignReport(
  reportId: string,
  workerId: string,
): Promise<{ kind: 'success' } | { kind: 'error'; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/reports/${reportId}/assign`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ workerId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { kind: 'error', message: data?.message ?? `HTTP ${res.status}` };
    }
    return { kind: 'success' };
  } catch {
    return { kind: 'error', message: 'Erreur réseau. Veuillez réessayer.' };
  }
}
