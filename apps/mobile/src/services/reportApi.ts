/**
 * EcoTrack Mobile – Report submission API client.
 * POST /api/v1/reports  (multipart/form-data)
 */
import { env } from '../config/env';

export const REPORTS_PATH = '/api/v1/reports';

export type SubmitReportParams = {
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUri?: string | null;
  token?: string | null;
};

export type SubmitReportResult =
  | { kind: 'success'; reportId: string | null }
  | { kind: 'error'; message: string };

export async function submitReport({
  category,
  description,
  latitude,
  longitude,
  photoUri,
  token,
}: SubmitReportParams): Promise<SubmitReportResult> {
  const baseUrl = (env.apiUrl || 'http://localhost:8080').replace(/\/+$/, '');

  const formData = new FormData();
  formData.append('category', category);
  formData.append('description', description);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));

  if (photoUri) {
    // React Native FormData accepts an object with uri/name/type
    const filename = photoUri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('photo', { uri: photoUri, name: filename, type } as any);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}${REPORTS_PATH}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.ok) {
      let reportId: string | null = null;
      try {
        const json = (await response.json()) as { id?: string; reportId?: string };
        reportId = json?.id ?? json?.reportId ?? null;
      } catch {
        // body may be empty
      }
      return { kind: 'success', reportId };
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
