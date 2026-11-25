export interface MunicipalityTerritory {
  center: [number, number]; // [lat, lng]
  bbox: [number, number, number, number]; // [south, north, west, east]
  displayName: string;
  polygon?: [number, number][]; // [[lat, lng], ...]
}

const KNOWN_TUNISIAN_TERRITORIES: Record<string, MunicipalityTerritory> = {
  zarzouna: {
    center: [37.2556, 9.8753],
    bbox: [37.2438, 37.2693, 9.8638, 9.888],
    displayName: 'Zarzouna, Gouvernorat Bizerte, Tunisie',
  },
  'bou salem': {
    center: [36.6111, 8.9698],
    bbox: [36.59, 36.635, 8.94, 9.0],
    displayName: 'Bou Salem, Gouvernorat Jendouba, Tunisie',
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
    center: [36.4, 10.6167],
    bbox: [36.36, 36.44, 10.56, 10.67],
    displayName: 'Hammamet, Nabeul, Tunisie',
  },
  monastir: {
    center: [35.7643, 10.8113],
    bbox: [35.73, 35.8, 10.77, 10.85],
    displayName: 'Monastir, Tunisie',
  },
};

export function extractLocalityName(rawName: string): string {
  const cleaned = rawName
    .trim()
    .replace(/^(mairie|municipalit[eé]|commune|ville|d[eé]l[eé]gation)\s+(de\s+la\s+|du\s+|de\s+l['’]|d['’]|de\s+|des\s+)?/i, '')
    .replace(/\s*[-–·]\s*(centre|tri|direction|services).*$/i, '')
    .trim();
  return cleaned || rawName.trim();
}

export function extractGovernorateName(rawGov?: string): string {
  if (!rawGov) return '';
  return rawGov
    .trim()
    .replace(/^(gouvernorat|r[eé]gion|wilaya)\s+(de\s+la\s+|du\s+|de\s+l['’]|d['’]|de\s+)?/i, '')
    .trim();
}

/**
 * Normalise les noms tunisiens fréquemment collés (ex: "boussalem" -> "bou salem", "benard" -> "ben ...")
 */
function buildSearchVariants(locality: string): string[] {
  const base = locality.trim();
  const variants = [base];
  const spaced = base
    .replace(/^bou([a-z])/i, 'Bou $1')
    .replace(/^ben([a-z])/i, 'Ben $1')
    .replace(/^sidi([a-z])/i, 'Sidi $1')
    .replace(/^ain([a-z])/i, 'Ain $1')
    .replace(/^bir([a-z])/i, 'Bir $1')
    .replace(/^oued([a-z])/i, 'Oued $1')
    .replace(/^el([a-z])/i, 'El $1')
    .replace(/ss/gi, 's');
  if (spaced.toLowerCase() !== base.toLowerCase()) {
    variants.push(spaced);
  }
  // Also try replacing double 's' after Bou (e.g. boussalem -> Bou Salem)
  const bouSalemFix = base.replace(/^bouss/i, 'Bou S');
  if (bouSalemFix.toLowerCase() !== base.toLowerCase() && !variants.includes(bouSalemFix)) {
    variants.push(bouSalemFix);
  }
  return variants;
}

function downsampleRing(ring: number[][], maxPoints = 90): [number, number][] {
  if (!Array.isArray(ring) || ring.length === 0) return [];
  const step = Math.max(1, Math.floor(ring.length / maxPoints));
  const out: [number, number][] = [];
  for (let i = 0; i < ring.length; i += step) {
    const pt = ring[i];
    if (Array.isArray(pt) && pt.length >= 2 && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) {
      out.push([Number(pt[1]), Number(pt[0])]);
    }
  }
  return out;
}

function normalizeAscii(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function scoreCandidate(hit: any, cleanGov: string): number {
  let score = 0;
  const display = normalizeAscii(String(hit.display_name || ''));
  const addrState = normalizeAscii(String(hit.address?.state || hit.address?.county || ''));
  const type = String(hit.addresstype || hit.type || '').toLowerCase();
  const cls = String(hit.class || '').toLowerCase();

  if (cleanGov) {
    const govNorm = normalizeAscii(cleanGov);
    if (display.includes(govNorm) || addrState.includes(govNorm)) {
      score += 150;
    } else {
      score -= 200; // Strong penalty when governorate does NOT match!
    }
  }

  if (cls === 'boundary' || type === 'administrative' || type === 'municipality') score += 80;
  else if (type === 'city' || type === 'town' || type === 'village') score += 60;
  else if (type === 'suburb' || type === 'quarter' || type === 'neighbourhood' || type === 'hamlet') score -= 60;

  if (hit.geojson?.type === 'Polygon' || hit.geojson?.type === 'MultiPolygon') {
    score += 25;
  }

  return score;
}

async function queryNominatim(q: string): Promise<any[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=tn&format=json&addressdetails=1&polygon_geojson=1&limit=10&accept-language=fr`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EcoTrack-Tunisia-SmartCity/2.0',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    return Array.isArray(data) ? data : [];
  } catch {
    clearTimeout(timer);
    return [];
  }
}

/**
 * Analyse le nom de la mairie et son gouvernorat, interroge Nominatim sur la Tunisie (countrycodes=tn)
 * et sélectionne le candidat correspondant exactement au gouvernorat et à la municipalité (jamais un simple quartier).
 */
export async function resolveMunicipalityTerritory(
  municipalityName: string,
  governorateName?: string
): Promise<MunicipalityTerritory | null> {
  const locality = extractLocalityName(municipalityName);
  if (!locality) return null;

  const cleanGov = extractGovernorateName(governorateName);
  const variants = buildSearchVariants(locality);

  const allCandidates: any[] = [];
  for (const variant of variants) {
    const q = cleanGov ? `${variant}, ${cleanGov}, Tunisia` : `${variant}, Tunisia`;
    const hits = await queryNominatim(q);
    allCandidates.push(...hits);
    if (hits.length > 0 && cleanGov && hits.some((h) => scoreCandidate(h, cleanGov) > 100)) {
      break;
    }
  }

  // If governorate-filtered query yielded nothing, try without governorate in string but still score strictly by governorate
  if (allCandidates.length === 0 && cleanGov) {
    for (const variant of variants) {
      const hits = await queryNominatim(`${variant}, Tunisia`);
      allCandidates.push(...hits);
    }
  }

  if (allCandidates.length > 0) {
    allCandidates.sort((a, b) => scoreCandidate(b, cleanGov) - scoreCandidate(a, cleanGov));
    const best = allCandidates[0];
    const bestScore = scoreCandidate(best, cleanGov);

    // Only accept if it didn't fail the governorate check when a governorate was explicitly given
    if (!cleanGov || bestScore > -100) {
      if (best?.lat && best?.lon && Array.isArray(best.boundingbox) && best.boundingbox.length === 4) {
        const center: [number, number] = [parseFloat(best.lat), parseFloat(best.lon)];
        const bbox: [number, number, number, number] = [
          parseFloat(best.boundingbox[0]),
          parseFloat(best.boundingbox[1]),
          parseFloat(best.boundingbox[2]),
          parseFloat(best.boundingbox[3]),
        ];

        let polygon: [number, number][] | undefined;
        if (best.geojson?.type === 'Polygon' && Array.isArray(best.geojson.coordinates?.[0])) {
          polygon = downsampleRing(best.geojson.coordinates[0]);
        } else if (best.geojson?.type === 'MultiPolygon' && Array.isArray(best.geojson.coordinates?.[0]?.[0])) {
          polygon = downsampleRing(best.geojson.coordinates[0][0]);
        }

        return {
          center,
          bbox,
          displayName: String(best.display_name || `${locality}, Tunisie`),
          ...(polygon && polygon.length >= 3 ? { polygon } : {}),
        };
      }
    }
  }

  for (const variant of variants) {
    const key = normalizeAscii(variant);
    if (KNOWN_TUNISIAN_TERRITORIES[key]) {
      return KNOWN_TUNISIAN_TERRITORIES[key];
    }
  }

  return null;
}
