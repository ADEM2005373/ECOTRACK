import { describe, expect, it } from 'vitest';
import { readMapConfig } from '../config';

const TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

describe('readMapConfig', () => {
  it('returns the configuration and trims the trailing slash of the API base URL', () => {
    expect(readMapConfig({ VITE_API_BASE_URL: ' /api/v1/ ', VITE_MAP_TILE_URL: TILE })).toEqual({
      ok: true,
      config: { apiBaseUrl: '/api/v1', tileUrl: TILE },
    });
  });

  it('lists every missing or blank variable', () => {
    expect(readMapConfig({})).toEqual({ ok: false, missing: ['VITE_API_BASE_URL', 'VITE_MAP_TILE_URL'] });
    expect(readMapConfig({ VITE_API_BASE_URL: '  ', VITE_MAP_TILE_URL: TILE })).toEqual({
      ok: false,
      missing: ['VITE_API_BASE_URL'],
    });
  });
});
