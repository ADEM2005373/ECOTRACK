import L from 'leaflet';
import { STATUS_LABELS } from './strings.fr';
import type { ReportStatus } from './types';

export interface StatusStyle {
  /** Marker fill. */
  fill: string;
  /** Glyph colour, at least 4.5:1 against the fill (WCAG AA). */
  text: string;
  /** One letter per status so the marker is readable without colour. */
  glyph: string;
}

/**
 * Ticket SCRUM-59: amber = NOUVEAU, blue = VALIDE / ASSIGNE, orange = EN_TRAITEMENT,
 * green = RESOLU. Not covered by the ticket: violet = EN_COURS_DE_VALIDATION,
 * slate = REJETE. Every marker also has a white ring and a dark outline, which keep
 * a 3:1 boundary against any map tile.
 */
export const STATUS_STYLES: Record<ReportStatus, StatusStyle> = {
  NOUVEAU: { fill: '#FBBF24', text: '#1C1917', glyph: 'N' },
  EN_COURS_DE_VALIDATION: { fill: '#6D28D9', text: '#FFFFFF', glyph: 'Q' },
  VALIDE: { fill: '#1D4ED8', text: '#FFFFFF', glyph: 'V' },
  ASSIGNE: { fill: '#1D4ED8', text: '#FFFFFF', glyph: 'A' },
  EN_TRAITEMENT: { fill: '#C2410C', text: '#FFFFFF', glyph: 'T' },
  RESOLU: { fill: '#15803D', text: '#FFFFFF', glyph: 'R' },
  REJETE: { fill: '#475569', text: '#FFFFFF', glyph: 'X' },
};

/** Clickable area (44 px target); the visible disc is smaller (see supervisionMap.css). */
const ICON_SIZE = 44;

const iconCache = new Map<ReportStatus, L.DivIcon>();

/**
 * Leaflet divIcon of a status (avoids the broken default PNG icon under Vite).
 * The HTML only contains constants of this module, never report data.
 */
export function statusIcon(status: ReportStatus): L.DivIcon {
  const cached = iconCache.get(status);
  if (cached) {
    return cached;
  }
  const { fill, text, glyph } = STATUS_STYLES[status];
  const icon = L.divIcon({
    className: 'eco-marker-icon',
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
    popupAnchor: [0, -ICON_SIZE / 3],
    html:
      `<span class="eco-marker" style="background-color:${fill};color:${text}">` +
      `<span aria-hidden="true">${glyph}</span>` +
      `<span class="sr-only">${STATUS_LABELS[status]}</span>` +
      '</span>',
  });
  iconCache.set(status, icon);
  return icon;
}
