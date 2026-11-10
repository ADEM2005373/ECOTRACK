import { colors, contrastRatio } from '../colors';
import { textStyles } from '../typography';
import { touchTarget } from '../spacing';

describe('CDCF V2 color tokens', () => {
  it('exposes the official charter colors', () => {
    expect(colors.primary).toBe('#059669'); // Vert émeraude
    expect(colors.secondary).toBe('#1E3A8A'); // Bleu saphir
    expect(colors.action.primary).toBe(colors.secondary);
  });

  it('computes known WCAG ratios', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    expect(contrastRatio('#FFFFFF', '#1E3A8A')).toBeCloseTo(10.36, 1);
    expect(contrastRatio('#FFFFFF', '#059669')).toBeCloseTo(3.77, 1);
  });

  it.each([
    ['button text', colors.action.onPrimary, colors.action.primary],
    ['text', colors.text, colors.surface],
    ['textMuted', colors.textMuted, colors.surface],
    ['tab active', colors.tabBar.active, colors.tabBar.background],
    ['tab inactive', colors.tabBar.inactive, colors.tabBar.background],
    ['success text', colors.feedbackText.success, colors.surface],
    ['warning text', colors.feedbackText.warning, colors.surface],
    ['error text', colors.feedbackText.error, colors.surface],
  ])('%s passes WCAG AA (4.5:1)', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('white on emerald is NOT safe for small text', () => {
    expect(contrastRatio(colors.onPrimary, colors.primary)).toBeLessThan(4.5);
  });
});

describe('typography and sizing', () => {
  it('respects minimum readable sizes', () => {
    expect(textStyles.body.fontSize).toBeGreaterThanOrEqual(15);
    expect(textStyles.label.fontSize).toBeGreaterThanOrEqual(13);
    expect(textStyles.caption.fontSize).toBeGreaterThanOrEqual(13);
    expect(touchTarget.min).toBeGreaterThanOrEqual(44);
  });
});
