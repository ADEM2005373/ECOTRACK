/**
 * EcoTrack Mobile Design Tokens - Espacements, rayons et tailles tactiles.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Taille tactile minimale (WCAG 2.5.5 / Apple HIG : 44x44). */
export const touchTarget = {
  min: 44,
} as const;
