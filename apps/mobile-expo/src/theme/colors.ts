/**
 * EcoTrack Mobile Design Tokens - Color Palette CDCF V2
 * Conforme à la charte graphique officielle du projet.
 */

export const colors = {
  // Brand Core Colors (CDCF V2)
  primary: '#059669',       // Emerald 600 - Vert écologie & action
  primaryDark: '#047857',   // Emerald 700
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
  }
} as const;

export type Colors = typeof colors;
