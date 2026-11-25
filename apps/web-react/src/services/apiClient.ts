/**
 * Shared API client helpers — ECO-Deploy.
 * Reads VITE_API_URL at build time (empty = use Vite dev proxy).
 * Automatically appends ngrok-skip-browser-warning when targeting a Ngrok domain.
 */

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Build an absolute API URL (or relative when API_ORIGIN is empty). */
export function apiUrl(path: string): string {
  return `${API_ORIGIN}${path}`;
}

/** Returns common headers, adding ngrok bypass when needed. */
export function defaultHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };

  if (API_ORIGIN.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  return headers;
}

/** Auth headers including Bearer token from localStorage. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('ecotrack_access_token');
  return defaultHeaders({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  });
}

let fetchInterceptorInstalled = false;

/**
 * Intercepts global `window.fetch` so any relative `/api/...` or `/storage/...`
 * call in dashboards/components automatically targets `VITE_API_URL` and
 * includes `ngrok-skip-browser-warning` when deployed on Vercel.
 */
export function installApiFetchInterceptor(): void {
  if (fetchInterceptorInstalled || typeof window === 'undefined' || !API_ORIGIN) {
    return;
  }
  fetchInterceptorInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let nextInput = input;
    let isBackendCall = false;

    if (typeof input === 'string') {
      if (input.startsWith('/api/') || input.startsWith('/storage/')) {
        nextInput = `${API_ORIGIN}${input}`;
        isBackendCall = true;
      } else if (input.startsWith(API_ORIGIN)) {
        isBackendCall = true;
      }
    }

    if (isBackendCall && API_ORIGIN.includes('ngrok')) {
      const headers = new Headers(init?.headers);
      if (!headers.has('ngrok-skip-browser-warning')) {
        headers.set('ngrok-skip-browser-warning', 'true');
      }
      return nativeFetch(nextInput, { ...init, headers });
    }

    return nativeFetch(nextInput, init);
  };
}
