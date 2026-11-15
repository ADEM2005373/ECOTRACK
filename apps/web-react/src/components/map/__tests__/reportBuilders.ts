import type { MapReport } from '../types';

/** Test builder (test code only, never imported by the application). */
export function makeReport(overrides: Partial<MapReport> = {}): MapReport {
  return {
    id: '672f10a8b9e1c2d3e4f5a6b7',
    status: 'NOUVEAU',
    category: 'DEPOT_SAUVAGE',
    description: 'Déchets bloquant le trottoir',
    photoUrl: 'https://storage.example.test/reports/thumb-1.webp',
    position: [36.8065, 10.1815],
    createdAt: new Date('2026-11-10T09:30:00Z'),
    ...overrides,
  };
}

/** Raw API item shaped like report.schema.ts toJSON(). */
export function makeApiReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '672f10a8b9e1c2d3e4f5a6b7',
    reporterId: '65a1b2c3d4e5f60718293a4b',
    category: 'DEPOT_SAUVAGE',
    description: 'Déchets bloquant le trottoir',
    imageUrl: 'https://storage.example.test/reports/photo-1.webp',
    location: { type: 'Point', coordinates: [10.1815, 36.8065] },
    status: 'NOUVEAU',
    createdAt: '2026-11-10T09:30:00.000Z',
    updatedAt: '2026-11-10T09:30:00.000Z',
    ...overrides,
  };
}
