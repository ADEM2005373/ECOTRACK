import { Types } from 'mongoose';
import { ReportStatus } from '@ecotrack/shared';
import { ReportModel, ReportSchema } from '../report.schema';

// Coordonnées de test au format GeoJSON [longitude, latitude]
const TUNIS: [number, number] = [10.1815, 36.8065];

function validReport(overrides: Record<string, unknown> = {}) {
  return {
    reporterId: new Types.ObjectId(),
    category: 'DEPOT_SAUVAGE',
    description: 'Tas de gravats abandonné sur le trottoir',
    imageUrl: 'https://storage.ecotrack.local/reports/gravats-2026.webp',
    location: { type: 'Point', coordinates: TUNIS },
    ...overrides
  };
}

function errorPaths(overrides: Record<string, unknown>): string[] {
  const error = new ReportModel(validReport(overrides)).validateSync();
  return error ? Object.keys(error.errors) : [];
}

describe('ReportSchema validation', () => {
  it('accepts a valid report and applies defaults', () => {
    const report = new ReportModel(validReport());

    expect(report.validateSync()).toBeUndefined();
    expect(report.status).toBe(ReportStatus.NOUVEAU);
    expect(report.location.type).toBe('Point');
    expect([...report.location.coordinates]).toEqual(TUNIS);
  });

  it('defaults location.type to Point when omitted', () => {
    const report = new ReportModel(validReport({ location: { coordinates: TUNIS } }));

    expect(report.validateSync()).toBeUndefined();
    expect(report.location.type).toBe('Point');
  });

  it('accepts an optional description and every ReportStatus value', () => {
    expect(errorPaths({ description: undefined })).toEqual([]);
    for (const status of Object.values(ReportStatus)) {
      expect(errorPaths({ status })).toEqual([]);
    }
  });

  it('exposes id instead of _id and __v in JSON', () => {
    const json = new ReportModel(validReport()).toJSON();

    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });

  it.each([
    ['missing location', { location: undefined }, 'location'],
    ['missing coordinates', { location: { type: 'Point' } }, 'location.coordinates'],
    ['empty coordinates', { location: { type: 'Point', coordinates: [] } }, 'location.coordinates'],
    ['1 coordinate', { location: { type: 'Point', coordinates: [10.1815] } }, 'location.coordinates'],
    ['3 coordinates', { location: { type: 'Point', coordinates: [10.1815, 36.8065, 5] } }, 'location.coordinates'],
    ['longitude 181', { location: { type: 'Point', coordinates: [181, 36.8065] } }, 'location.coordinates'],
    ['latitude 91', { location: { type: 'Point', coordinates: [10.1815, 91] } }, 'location.coordinates'],
    ['wrong GeoJSON type', { location: { type: 'Polygon', coordinates: TUNIS } }, 'location.type'],
    ['unknown status', { status: 'ARCHIVE' }, 'status'],
    ['missing reporterId', { reporterId: undefined }, 'reporterId'],
    ['invalid reporterId', { reporterId: 'not-an-object-id' }, 'reporterId'],
    ['missing imageUrl', { imageUrl: undefined }, 'imageUrl'],
    ['missing category', { category: undefined }, 'category'],
    ['blank category', { category: '   ' }, 'category'],
    ['description over 2000 chars', { description: 'x'.repeat(2001) }, 'description'],
    ['aiConfidenceScore above 1', { aiConfidenceScore: 1.5 }, 'aiConfidenceScore']
  ])('rejects %s', (_label, overrides, expectedPath) => {
    expect(errorPaths(overrides)).toContain(expectedPath);
  });

  it('rejects non-numeric coordinates', () => {
    const paths = errorPaths({ location: { type: 'Point', coordinates: ['abc', 36.8065] } });

    expect(paths.some((path) => path.startsWith('location.coordinates'))).toBe(true);
  });
});

describe('ReportSchema indexes', () => {
  it('declares the 2dsphere index on location', () => {
    expect(ReportSchema.indexes()).toContainEqual([{ location: '2dsphere' }, expect.any(Object)]);
  });

  it('declares the status and reporter listing indexes', () => {
    const fields = ReportSchema.indexes().map(([index]) => index);

    expect(fields).toContainEqual({ status: 1, createdAt: -1 });
    expect(fields).toContainEqual({ reporterId: 1, createdAt: -1 });
  });

  it('enables timestamps', () => {
    expect(ReportSchema.get('timestamps')).toBe(true);
  });
});
