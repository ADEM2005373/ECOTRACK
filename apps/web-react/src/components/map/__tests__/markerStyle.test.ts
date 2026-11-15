import { describe, expect, it } from 'vitest';
import { STATUS_STYLES, statusIcon } from '../markerStyle';
import { REPORT_STATUSES } from '../types';

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('STATUS_STYLES', () => {
  it('covers exactly the 7 report statuses', () => {
    expect(Object.keys(STATUS_STYLES).sort()).toEqual([...REPORT_STATUSES].sort());
  });

  it('follows the ticket colours', () => {
    expect(STATUS_STYLES.NOUVEAU.fill).toBe('#FBBF24'); // amber
    expect(STATUS_STYLES.VALIDE.fill).toBe('#1D4ED8'); // blue
    expect(STATUS_STYLES.ASSIGNE.fill).toBe('#1D4ED8'); // blue
    expect(STATUS_STYLES.EN_TRAITEMENT.fill).toBe('#C2410C'); // orange
    expect(STATUS_STYLES.RESOLU.fill).toBe('#15803D'); // green
  });

  it('gives each status its own glyph (not colour alone)', () => {
    const glyphs = REPORT_STATUSES.map((status) => STATUS_STYLES[status].glyph);
    expect(new Set(glyphs).size).toBe(REPORT_STATUSES.length);
  });

  it.each(REPORT_STATUSES)('%s glyph meets WCAG AA text contrast (4.5:1)', (status) => {
    const { fill, text } = STATUS_STYLES[status];
    expect(contrast(fill, text)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('statusIcon', () => {
  it.each(REPORT_STATUSES)('builds a cached divIcon for %s', (status) => {
    const icon = statusIcon(status);
    expect(icon).toBe(statusIcon(status));
    expect(icon.options.className).toBe('eco-marker-icon');
    expect(icon.options.iconSize).toEqual([44, 44]);
    expect(icon.options.html).toContain(STATUS_STYLES[status].fill);
    expect(icon.options.html).toContain(`>${STATUS_STYLES[status].glyph}<`);
  });
});
