import type { ReportStatus } from './types';

/** French UI strings of the supervision map (SCRUM-59). */

export const STATUS_LABELS: Record<ReportStatus, string> = {
  NOUVEAU: 'Nouveau (en attente d’arbitrage)',
  EN_COURS_DE_VALIDATION: 'En cours de validation',
  VALIDE: 'Validé',
  ASSIGNE: 'Assigné à une équipe',
  EN_TRAITEMENT: 'En traitement',
  RESOLU: 'Résolu',
  REJETE: 'Rejeté',
};

/**
 * Labels of the category codes seeded in Dim_Category (services/bi-etl/sql/02).
 * The report category is a free string: unknown codes are shown as is.
 */
const CATEGORY_LABELS: Record<string, string> = {
  DEPOT_SAUVAGE: 'Dépôt sauvage',
  ENCOMBRANTS: 'Encombrants',
  DECHETS_VERTS: 'Déchets verts',
  GRAVATS_CHANTIER: 'Gravats de chantier',
  DECHETS_TOXIQUES: 'Déchets dangereux ou toxiques',
  DEBORDEMENT_BAC: 'Débordement de bac',
};

export function categoryLabel(code: string): string {
  return CATEGORY_LABELS[code] ?? code;
}

export const MAP_STRINGS = {
  pageTitle: 'Carte de supervision',
  pageSubtitle: 'Signalements urbains en temps réel — Responsables voirie et élus',
  backHome: 'Retour à l’accueil',
  navLink: 'Carte de supervision',
  mapRegionLabel: 'Carte des signalements',

  filtersTitle: 'Filtres',
  categoryLabel: 'Catégorie',
  statusLabel: 'Statut de traitement',
  urgencyLabel: 'Niveau d’urgence',
  allOption: 'Toutes',
  allStatusesOption: 'Tous les statuts',
  urgencyUnavailableOption: 'Non disponible',
  urgencyUnavailableHelp:
    'Filtre indisponible : l’API des signalements ne fournit pas encore de niveau d’urgence.',
  resetFilters: 'Réinitialiser les filtres',

  legendTitle: 'Légende des statuts',

  loading: 'Chargement des signalements…',
  emptyNoData: 'Aucun signalement à afficher pour le moment.',
  emptyNoMatch: 'Aucun signalement ne correspond aux filtres sélectionnés.',
  retry: 'Réessayer',
  errorTitle: 'Impossible de charger les signalements',
  errorUnauthorized: 'Accès refusé : une connexion avec un compte autorisé est requise.',
  errorUnavailable: (httpStatus: number | null) =>
    `Le service des signalements est indisponible${httpStatus ? ` (HTTP ${httpStatus})` : ''}.`,
  errorNetwork: 'L’API des signalements est injoignable. Vérifiez votre connexion ou la passerelle.',
  errorInvalidPayload: 'La réponse de l’API des signalements n’a pas le format attendu.',
  configErrorTitle: 'Configuration manquante',
  configErrorBody: (variables: readonly string[]) =>
    `Variables d’environnement à définir dans apps/web-react/.env.local : ${variables.join(', ')}.`,

  shownCount: (shown: number, total: number) =>
    `${shown} signalement${shown > 1 ? 's' : ''} affiché${shown > 1 ? 's' : ''} sur ${total}`,
  skippedCount: (skipped: number) =>
    `${skipped} signalement${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''} (localisation ou données invalides)`,

  popupPhotoAlt: (category: string) => `Photo du signalement : ${category}`,
  popupNoPhoto: 'Photo indisponible',
  popupStatus: 'Statut',
  popupCreatedAt: 'Signalé le',
  markerTitle: (category: string, status: string) => `${category} — ${status}`,
} as const;

/** Reports are displayed in the city's time zone, whatever the browser's. */
export const DISPLAY_TIME_ZONE = 'Africa/Tunis';

export function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: DISPLAY_TIME_ZONE,
  }).format(date);
}

/** Required by the OpenStreetMap tile usage policy. */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
