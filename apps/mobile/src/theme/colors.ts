/**
 * EcoTrack Mobile Design Tokens - Color Palette CDCF V2
 * Conforme à la charte graphique officielle du projet.
 *
 * Accessibilité (WCAG 2.1 AA : 4.5:1 texte normal, 3:1 grand texte / icônes) :
 * - Blanc sur Bleu saphir #1E3A8A = 10.36:1 -> boutons principaux (colors.action).
 * - Blanc sur Vert émeraude #059669 = 3.77:1 -> ÉCHEC pour le petit texte.
 *   L'émeraude sert aux accents, icônes, badges, grands textes (>= 24px, ou
 *   >= 18.66px gras). Pour un texte vert de petite taille, utiliser primaryDark.
 * Les ratios sont vérifiés par src/theme/__tests__/colors.test.ts.
 */

export const colors = {
  // Brand Core Colors (CDCF V2)
  primary: '#059669',       // Emerald 600 - Vert écologie & action
  primaryDark: '#047857',   // Emerald 700 - 5.48:1 sur blanc (texte vert AA)
  primaryLight: '#10B981',  // Emerald 500
  primarySubtle: '#ECFDF5', // Emerald 50

  secondary: '#1E3A8A',     // Sapphire Blue 900 - Institutionnel & Autorité
  secondaryLight: '#2563EB',// Blue 600
  secondarySubtle: '#EFF6FF',// Blue 50

  // Semantic Feedback Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Workflow Status Colors (T1 -> T5)
  workflow: {
    submitted: '#3B82F6',   // T0: Nouveau / Soumis
    validated: '#10B981',   // T1: Validé par Agent
    assigned: '#8B5CF6',    // T2: Assigné à Équipe Voirie
    inProgress: '#F59E0B',  // T3: En cours d'intervention
    resolved: '#059669',    // T4: Résolu avec photo après travaux
    rejected: '#EF4444',    // T5: Rejeté avec motif
  },

  // Neutral Gray Scale
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Dark Theme Surface
  dark: {
    background: '#080D1A',
    card: '#0F172A',
    cardHover: '#17223B',
    border: '#1E293B',
    borderLight: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },

  // Light Theme Surface
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    cardHover: '#F1F5F9',
    border: '#E2E8F0',
    borderLight: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },

  // Semantic tokens (thème clair, app.json userInterfaceStyle "light").
  // Tous les couples texte/fond ci-dessous passent AA (>= 4.5:1).
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',          // 17.1:1 sur surface
  textMuted: '#64748B',     // 4.76:1 sur surface
  border: '#E2E8F0',
  onPrimary: '#FFFFFF',

  // Couleurs de texte pour les messages (les teintes "success/warning/danger"
  // plus haut restent pour les fonds, badges et icônes).
  feedbackText: {
    success: '#047857',     // 5.48:1
    warning: '#B45309',     // 5.02:1
    error: '#B91C1C',       // 6.47:1
  },

  // Actions : bouton principal en Bleu saphir (institution) avec texte blanc.
  action: {
    primary: '#1E3A8A',
    primaryPressed: '#172554',
    onPrimary: '#FFFFFF',
  },

  // Barre d'onglets.
  tabBar: {
    background: '#FFFFFF',
    border: '#E2E8F0',
    active: '#047857',      // Emerald 700 : identité verte + 5.48:1 (libellés 13px)
    inactive: '#64748B',
  },
} as const;

export type Colors = typeof colors;

/** Ratio de contraste WCAG 2.1 entre deux couleurs hex (#RRGGBB). */
export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    const value = hex.replace('#', '');
    const channels = [0, 2, 4].map((i) => {
      const c = parseInt(value.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const [r = 0, g = 0, b = 0] = channels;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
