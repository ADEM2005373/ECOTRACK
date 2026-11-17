/** Reads VITE_API_BASE_URL (shared with the map, see apps/web-react/.env.example); null if missing. */
export function readApiBaseUrl(env: Partial<Record<'VITE_API_BASE_URL', string>>): string | null {
  const value = env.VITE_API_BASE_URL?.trim() ?? '';
  return value === '' ? null : value.replace(/\/+$/, '');
}
