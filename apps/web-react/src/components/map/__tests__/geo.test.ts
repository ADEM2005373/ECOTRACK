import { describe, expect, it } from 'vitest';
import { geoJsonPointToLatLng } from '../geo';

describe('geoJsonPointToLatLng', () => {
  it('converts GeoJSON [lng, lat] to Leaflet [lat, lng] (Tunis)', () => {
    expect(geoJsonPointToLatLng({ type: 'Point', coordinates: [10.1815, 36.8065] })).toEqual([36.8065, 10.1815]);
  });

  it.each([
    ['Sfax', [10.76, 34.7406], [34.7406, 10.76]],
    ['Djerba', [10.8575, 33.8076], [33.8076, 10.8575]],
    ['bounds', [-180, 90], [90, -180]],
  ])('converts %s', (_name, coordinates, expected) => {
    expect(geoJsonPointToLatLng({ type: 'Point', coordinates })).toEqual(expected);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string', '10.18,36.80'],
    ['missing coordinates', { type: 'Point' }],
    ['wrong type', { type: 'Polygon', coordinates: [10.1815, 36.8065] }],
    ['one value', { type: 'Point', coordinates: [10.1815] }],
    ['three values', { type: 'Point', coordinates: [10.1815, 36.8065, 12] }],
    ['string values', { type: 'Point', coordinates: ['10.1815', '36.8065'] }],
    ['NaN', { type: 'Point', coordinates: [Number.NaN, 36.8065] }],
    ['latitude out of range', { type: 'Point', coordinates: [10.1815, 95] }],
    ['longitude out of range', { type: 'Point', coordinates: [181, 36.8065] }],
  ])('rejects %s', (_name, location) => {
    expect(geoJsonPointToLatLng(location)).toBeNull();
  });
});
