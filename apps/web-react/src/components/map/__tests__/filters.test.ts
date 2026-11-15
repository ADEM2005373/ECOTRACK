import { describe, expect, it } from 'vitest';
import { categoryOptions, filterReports, hasActiveFilters, NO_FILTERS } from '../filters';
import { makeReport } from './reportBuilders';

const reports = [
  makeReport({ id: 'a', category: 'DEPOT_SAUVAGE', status: 'NOUVEAU' }),
  makeReport({ id: 'b', category: 'ENCOMBRANTS', status: 'NOUVEAU' }),
  makeReport({ id: 'c', category: 'DEPOT_SAUVAGE', status: 'RESOLU' }),
  makeReport({ id: 'd', category: 'DECHETS_VERTS', status: 'EN_TRAITEMENT' }),
];

const ids = (list: { id: string }[]) => list.map((report) => report.id);

describe('filterReports', () => {
  it('returns every report without filters', () => {
    expect(ids(filterReports(reports, NO_FILTERS))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('filters by category', () => {
    expect(ids(filterReports(reports, { ...NO_FILTERS, category: 'DEPOT_SAUVAGE' }))).toEqual(['a', 'c']);
  });

  it('filters by status', () => {
    expect(ids(filterReports(reports, { ...NO_FILTERS, status: 'NOUVEAU' }))).toEqual(['a', 'b']);
  });

  it('combines category and status', () => {
    expect(ids(filterReports(reports, { category: 'DEPOT_SAUVAGE', status: 'RESOLU' }))).toEqual(['c']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterReports(reports, { category: 'ENCOMBRANTS', status: 'RESOLU' })).toEqual([]);
  });

  it('returns everything again after a reset', () => {
    const filtered = filterReports(reports, { category: 'ENCOMBRANTS', status: 'NOUVEAU' });
    expect(filtered).toHaveLength(1);
    expect(filterReports(reports, NO_FILTERS)).toHaveLength(4);
  });

  it('does not mutate its input', () => {
    const copy = [...reports];
    filterReports(reports, { ...NO_FILTERS, status: 'RESOLU' });
    expect(reports).toEqual(copy);
  });
});

describe('hasActiveFilters', () => {
  it('is false without filters and true with any filter', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, category: 'ENCOMBRANTS' })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, status: 'VALIDE' })).toBe(true);
  });
});

describe('categoryOptions', () => {
  it('lists distinct categories sorted by French label, unknown codes included', () => {
    const list = [...reports, makeReport({ id: 'e', category: 'AUTRE_CODE' })];
    // Labels: AUTRE_CODE, Déchets verts, Dépôt sauvage, Encombrants
    expect(categoryOptions(list)).toEqual(['AUTRE_CODE', 'DECHETS_VERTS', 'DEPOT_SAUVAGE', 'ENCOMBRANTS']);
  });

  it('is empty for an empty list', () => {
    expect(categoryOptions([])).toEqual([]);
  });
});
