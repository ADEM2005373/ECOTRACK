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
    mono: 'JetBrainsMono-Regular', // Non chargée pour l'instant (voir fonts.ts)
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

/**
 * Styles de texte prêts à l'emploi (minimum 15px pour le corps, 13px pour
 * les libellés). Pas de fontWeight : la graisse vient de la famille chargée,
 * sinon Android peut ignorer la police personnalisée.
 */
export const textStyles = {
  heading: { fontFamily: typography.fonts.heading, fontSize: 28, lineHeight: 34 },
  subtitle: { fontFamily: typography.fonts.headingSemiBold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: typography.fonts.body, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: typography.fonts.bodyMedium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: typography.fonts.body, fontSize: 13, lineHeight: 18 },
} as const;

export type TextStyleName = keyof typeof textStyles;
