/** Leaflet order: [latitude, longitude]. */
export type LatLng = [latitude: number, longitude: number];

/** Tunis city centre, initial view of the supervision map. */
export const CITY_CENTER: LatLng = [36.8065, 10.1815];
export const INITIAL_ZOOM = 13;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * GeoJSON Point (RFC 7946, `coordinates: [longitude, latitude]`, as stored by
 * report.schema.ts) -> Leaflet [latitude, longitude].
 * Returns null for anything that is not a valid WGS84 point.
 */
export function geoJsonPointToLatLng(location: unknown): LatLng | null {
  if (typeof location !== 'object' || location === null) {
    return null;
  }
  const { type, coordinates } = location as { type?: unknown; coordinates?: unknown };
  if (type !== 'Point' || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }
  const [longitude, latitude] = coordinates as unknown[];
  if (
    !isFiniteNumber(longitude) ||
    !isFiniteNumber(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }
  return [latitude, longitude];
}
