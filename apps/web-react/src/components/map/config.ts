export interface MapConfig {
  apiBaseUrl: string;
  tileUrl: string;
}

export type MapConfigResult =
  | { ok: true; config: MapConfig }
  | { ok: false; missing: string[] };

type MapEnv = Partial<Record<'VITE_API_BASE_URL' | 'VITE_MAP_TILE_URL', string>>;

/** Reads the map configuration from the Vite environment (see apps/web-react/.env.example). */
export function readMapConfig(env: MapEnv): MapConfigResult {
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim() ?? '';
  const tileUrl = env.VITE_MAP_TILE_URL?.trim() ?? '';
  const missing = [
    ...(apiBaseUrl ? [] : ['VITE_API_BASE_URL']),
    ...(tileUrl ? [] : ['VITE_MAP_TILE_URL']),
  ];
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, config: { apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''), tileUrl } };
}
