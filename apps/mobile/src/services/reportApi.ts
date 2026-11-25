/**
 * EcoTrack Mobile – Citizen Report API client.
 * Connecté en temps réel à l'API Gateway et MongoDB (ecotrack_db).
 */
import { env, baseHeaders } from '../config/env';

export const REPORTS_PATH = '/api/v1/reports';

export type CitizenReportStatus = 'NOUVEAU' | 'EN_COURS' | 'RESOLU' | 'REJETE';

export type CitizenReport = {
  id: string;
  reference: string;
  title: string;
  category: string;
  categoryCode: string;
  description: string;
  district: string;
  date: string;
  status: CitizenReportStatus;
  statusLabel: string;
  beforePhoto: string;
  afterPhoto?: string;
  resolutionNote?: string;
  rejectionReason?: string;
  latitude: number;
  longitude: number;
};

export type SubmitReportParams = {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUri?: string | null;
  photoBase64?: string | null;
  reporterId?: string | null;
  municipality?: string | null;
  district?: string | null;
  token?: string | null;
};

export type SubmitReportResult =
  | {
      kind: 'success';
      reportId: string | null;
      mairieCovered?: boolean;
      municipality?: string | null;
      detectedLocality?: string | null;
      message?: string;
    }
  | { kind: 'error'; message: string };

export type ReportsFetchResult =
  | { kind: 'success'; data: CitizenReport[] }
  | { kind: 'error'; message: string };

const CATEGORY_LABELS: Record<string, string> = {
  DEPOT_SAUVAGE: 'Dépôt sauvage',
  ENCOMBRANTS: 'Encombrants',
  DECHETS_DANGEREUX: 'Déchets dangereux',
  GRAFFITI: 'Graffiti',
  VEGETAUX: 'Végétaux',
  DEBORDEMENT_BAC: 'Bacs débordants',
  AUTRE: 'Autre anomalie',
};

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  DEPOT_SAUVAGE: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
  ENCOMBRANTS: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
  DECHETS_DANGEREUX: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
  GRAFFITI: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
  VEGETAUX: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
  AUTRE: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
};

function baseUrl(): string {
  return (env.apiUrl || 'http://192.168.43.76:8090').replace(/\/+$/, '');
}

function formatDateFr(iso?: string): string {
  if (!iso) return 'Récemment';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Récemment';
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapStatus(rawStatus?: string): { status: CitizenReportStatus; label: string } {
  const s = String(rawStatus || 'NOUVEAU').toUpperCase();
  if (s === 'RESOLU' || s === 'TERMINEE') {
    return { status: 'RESOLU', label: 'Résolu & Nettoyé' };
  }
  if (s === 'REJETE' || s === 'REJECTED') {
    return { status: 'REJETE', label: 'Non retenu' };
  }
  if (s === 'ASSIGNE' || s === 'EN_TRAITEMENT' || s === 'EN_COURS' || s === 'VALIDE') {
    return { status: 'EN_COURS', label: s === 'EN_TRAITEMENT' ? 'Brigade sur place' : 'Pris en charge' };
  }
  return { status: 'NOUVEAU', label: 'Transmis mairie' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseCitizenReport(raw: any): CitizenReport | null {
  if (!raw) return null;
  const id = String(raw.id || raw._id || '');
  if (!id) return null;

  const categoryCode = String(raw.categoryValidated || raw.category || 'DEPOT_SAUVAGE').toUpperCase();
  const categoryLabel = CATEGORY_LABELS[categoryCode] || categoryCode;
  const { status, label } = mapStatus(raw.status);

  const coords = raw.location?.coordinates;
  const longitude = Array.isArray(coords) && typeof coords[0] === 'number' ? coords[0] : 9.8667;
  const latitude = Array.isArray(coords) && typeof coords[1] === 'number' ? coords[1] : 37.2667;

  const desc = String(raw.description || '').trim();
  const title = desc.length > 0
    ? (desc.length > 56 ? `${desc.slice(0, 56)}…` : desc)
    : categoryLabel;

  return {
    id,
    reference: raw.reference || `REP-2026-${id.slice(-4).toUpperCase()}`,
    title,
    category: categoryLabel,
    categoryCode,
    description: desc || `${categoryLabel} signalé dans la commune.`,
    district: raw.district
      ? `${raw.district}${raw.municipality ? `, ${raw.municipality}` : ''}`
      : `${raw.municipality || 'Commune'} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    date: formatDateFr(raw.createdAt),
    status,
    statusLabel: label,
    beforePhoto: raw.imageUrl || raw.thumbnailUrl || DEFAULT_CATEGORY_IMAGES[categoryCode] || DEFAULT_CATEGORY_IMAGES.DEPOT_SAUVAGE!,
    afterPhoto: raw.completionPhotoUrl || raw.afterImageUrl || raw.resolutionPhotoUrl,
    resolutionNote: raw.resolutionNotes || (status === 'EN_COURS' ? 'Dossier validé par la mairie et affecté à une brigade terrain.' : undefined),
    rejectionReason: raw.rejectionReason,
    latitude,
    longitude,
  };
}

export async function getMyReports(
  reporterId?: string | null,
  token?: string | null
): Promise<ReportsFetchResult> {
  try {
    const headers: Record<string, string> = baseHeaders({ Accept: 'application/json' });
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const query = reporterId ? `?reporterId=${encodeURIComponent(reporterId)}` : '';
    const res = await fetch(`${baseUrl()}${REPORTS_PATH}${query}`, { headers });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        kind: 'error',
        message: typeof body?.message === 'string' ? body.message : `Erreur serveur (${res.status}).`,
      };
    }

    const list = Array.isArray(body)
      ? body
      : (Array.isArray(body?.reports) ? body.reports : []);

    const parsed = list
      .map(parseCitizenReport)
      .filter((r: CitizenReport | null): r is CitizenReport => r !== null);

    return { kind: 'success', data: parsed };
  } catch {
    return {
      kind: 'error',
      message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    };
  }
}

export async function getCommunityReports(token?: string | null): Promise<ReportsFetchResult> {
  return getMyReports(undefined, token);
}

export async function submitReport({
  category,
  description,
  latitude,
  longitude,
  photoUri,
  photoBase64,
  reporterId,
  municipality,
  district,
  token,
}: SubmitReportParams): Promise<SubmitReportResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let imageUrl = DEFAULT_CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGES.DEPOT_SAUVAGE!;
  if (photoBase64) {
    imageUrl = photoBase64.startsWith('data:')
      ? photoBase64
      : `data:image/jpeg;base64,${photoBase64}`;
  } else if (photoUri && (photoUri.startsWith('http://') || photoUri.startsWith('https://') || photoUri.startsWith('data:'))) {
    imageUrl = photoUri;
  }

  const payload: Record<string, unknown> = {
    category,
    description,
    latitude,
    longitude,
    imageUrl,
  };
  if (reporterId) {
    payload.reporterId = reporterId;
  }
  if (municipality) {
    payload.municipality = municipality;
  }
  if (district) {
    payload.district = district;
  }

  try {
    const response = await fetch(`${baseUrl()}${REPORTS_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      let reportId: string | null = null;
      let mairieCovered: boolean | undefined;
      let municipality: string | null | undefined;
      let detectedLocality: string | null | undefined;
      let message: string | undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const json = (await response.json()) as any;
        reportId = json?.report?.id ?? json?.id ?? json?.reportId ?? null;
        if (typeof json?.mairieCovered === 'boolean') mairieCovered = json.mairieCovered;
        if (typeof json?.municipality === 'string') municipality = json.municipality;
        if (typeof json?.detectedLocality === 'string') detectedLocality = json.detectedLocality;
        if (typeof json?.message === 'string') message = json.message;
      } catch {
        // body may be empty
      }
      return { kind: 'success', reportId, mairieCovered, municipality, detectedLocality, message };
    }

    if (response.status === 401) {
      return { kind: 'error', message: 'Non autorisé. Veuillez vous reconnecter.' };
    }
    if (response.status === 400 || response.status === 422) {
      return { kind: 'error', message: 'Données invalides. Vérifiez le formulaire.' };
    }
    return { kind: 'error', message: `Erreur serveur (${response.status}). Réessayez plus tard.` };
  } catch {
    return {
      kind: 'error',
      message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    };
  }
}

export async function deleteMyReport(
  reportId: string,
  token?: string | null
): Promise<{ kind: 'success' } | { kind: 'error'; message: string }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${baseUrl()}${REPORTS_PATH}/${encodeURIComponent(reportId)}`, {
      method: 'DELETE',
      headers,
    });
    if (res.ok) return { kind: 'success' };
    return { kind: 'error', message: `Impossible de supprimer le signalement (${res.status}).` };
  } catch {
    return { kind: 'error', message: 'Impossible de joindre le serveur.' };
  }
}
