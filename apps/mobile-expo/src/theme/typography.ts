/**
 * EcoTrack Mobile Design Tokens - Typography CDCF V2
 * Setup polices PlusJakartaSans-Bold et Inter-Regular
 */

export const typography = {
  fonts: {
    heading: 'PlusJakartaSans-Bold',
    headingSemiBold: 'PlusJakartaSans-SemiBold',
    headingMedium: 'PlusJakartaSans-Medium',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodyBold: 'Inter-Bold',
    mono: 'JetBrainsMono-Regular',
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  }
} as const;

export type Typography = typeof typography;
