export interface MunicipalityTerritory {
  center: [number, number]; // [lat, lng]
  bbox: [number, number, number, number]; // [south, north, west, east]
  displayName: string;
  polygon?: [number, number][]; // [[lat, lng], ...]
}

const KNOWN_TUNISIAN_TERRITORIES: Record<string, MunicipalityTerritory> = {
  zarzouna: {
    center: [37.2667, 9.8833],
    bbox: [37.245, 37.29, 9.855, 9.915],
    displayName: 'Zarzouna, Bizerte, Tunisie',
  },
  bizerte: {
    center: [37.2746, 9.8739],
    bbox: [37.24, 37.31, 9.82, 9.92],
    displayName: 'Bizerte, Tunisie',
  },
  tunis: {
    center: [36.8065, 10.1815],
    bbox: [36.74, 36.87, 10.08, 10.26],
    displayName: 'Tunis, Tunisie',
  },
  'la marsa': {
    center: [36.8782, 10.3247],
    bbox: [36.85, 36.91, 10.29, 10.36],
    displayName: 'La Marsa, Tunis, Tunisie',
  },
  ariana: {
    center: [36.8665, 10.1647],
    bbox: [36.83, 36.91, 10.12, 10.22],
    displayName: 'Ariana, Tunisie',
  },
  sousse: {
    center: [35.8256, 10.6369],
    bbox: [35.78, 35.87, 10.58, 10.68],
    displayName: 'Sousse, Tunisie',
  },
  sfax: {
    center: [34.7406, 10.7603],
    bbox: [34.69, 34.8, 10.69, 10.83],
    displayName: 'Sfax, Tunisie',
  },
  nabeul: {
    center: [36.4561, 10.7376],
    bbox: [36.42, 36.49, 10.69, 10.78],
    displayName: 'Nabeul, Tunisie',
  },
  hammamet: {
    center: [36.4000, 10.6167],
    bbox: [36.36, 36.44, 10.56, 10.67],
    displayName: 'Hammamet, Nabeul, Tunisie',
  },
  monastir: {
    center: [35.7643, 10.8113],
    bbox: [35.73, 35.8, 10.77, 10.85],
    displayName: 'Monastir, Tunisie',
  },
};

/**
 * Extrait le nom de la ville/commune à partir du libellé d'une mairie
 * Ex: "Mairie de Zarzouna" -> "Zarzouna", "Municipalité d'Ariana" -> "Ariana"
 */
export function extractLocalityName(rawName: string): string {
  const cleaned = rawName
    .trim()
    .replace(/^(mairie|municipalit[eé]|commune|ville|gouvernorat|d[eé]l[eé]gation)\s+(de\s+la\s+|du\s+|de\s+l['’]|d['’]|de\s+|des\s+)?/i, '')
    .replace(/\s*[-–·]\s*(centre|tri|direction|services).*$/i, '')
    .trim();
  return cleaned || rawName.trim();
}

function downsampleRing(ring: number[][], maxPoints = 90): [number, number][] {
  if (!Array.isArray(ring) || ring.length === 0) return [];
  const step = Math.max(1, Math.floor(ring.length / maxPoints));
  const out: [number, number][] = [];
  for (let i = 0; i < ring.length; i += step) {
    const pt = ring[i];
    if (Array.isArray(pt) && pt.length >= 2 && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) {
      // GeoJSON is [lng, lat] -> Leaflet uses [lat, lng]
      out.push([Number(pt[1]), Number(pt[0])]);
    }
  }
  return out;
}

/**
 * Analyse le nom de la mairie, interroge Nominatim (OpenStreetMap) sur la Tunisie
 * et retourne le centre, la bounding box et le polygone territorial.
 */
export async function resolveMunicipalityTerritory(municipalityName: string): Promise<MunicipalityTerritory | null> {
  const locality = extractLocalityName(municipalityName);
  if (!locality) return null;

  const fallbackKey = locality.toLowerCase();

  try {
    const query = encodeURIComponent(`${locality}, Tunisia`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&polygon_geojson=1&limit=1&accept-language=fr`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EcoTrack-Tunisia-SmartCity/2.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const results = (await res.json()) as any[];
      const hit = Array.isArray(results) && results.length > 0 ? results[0] : null;
      if (hit && hit.lat && hit.lon && Array.isArray(hit.boundingbox) && hit.boundingbox.length === 4) {
        const center: [number, number] = [parseFloat(hit.lat), parseFloat(hit.lon)];
        const bbox: [number, number, number, number] = [
          parseFloat(hit.boundingbox[0]), // south
          parseFloat(hit.boundingbox[1]), // north
          parseFloat(hit.boundingbox[2]), // west
          parseFloat(hit.boundingbox[3]), // east
        ];

        let polygon: [number, number][] | undefined;
        if (hit.geojson?.type === 'Polygon' && Array.isArray(hit.geojson.coordinates?.[0])) {
          polygon = downsampleRing(hit.geojson.coordinates[0]);
        } else if (hit.geojson?.type === 'MultiPolygon' && Array.isArray(hit.geojson.coordinates?.[0]?.[0])) {
          polygon = downsampleRing(hit.geojson.coordinates[0][0]);
        }

        return {
          center,
          bbox,
          displayName: String(hit.display_name || `${locality}, Tunisie`),
          ...(polygon && polygon.length >= 3 ? { polygon } : {}),
        };
      }
    }
  } catch {
    // Fallback below if Nominatim is offline or times out
  }

  return KNOWN_TUNISIAN_TERRITORIES[fallbackKey] ?? null;
}
