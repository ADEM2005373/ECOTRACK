/**
 * Configuration publique de l'app (variables EXPO_PUBLIC_*, intégrées au bundle).
 * Ne jamais y mettre de secret. Voir apps/mobile/.env.example.
 */

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
} as const;

if (__DEV__ && !env.apiUrl) {
  console.warn('[env] EXPO_PUBLIC_API_URL non défini : copier apps/mobile/.env.example vers .env');
}
