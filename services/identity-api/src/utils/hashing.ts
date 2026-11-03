import * as argon2 from 'argon2';

/**
 * Configuration Argon2id durcie
 * Recommandations OWASP Password Storage Cheat Sheet & CDCF V2 (ECO-11)
 * - type: Argon2id (résistant aux attaques par canaux auxiliaires et attaques GPU)
 * - memoryCost: 65536 KiB (64 MiB)
 * - timeCost: 3 itérations
 * - parallelism: 4 threads
 */
export const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4
};

/**
 * Hache un mot de passe en clair avec l'algorithme Argon2id
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || plainText.length < 8) {
    throw new Error('Le mot de passe en clair doit contenir au moins 8 caractères');
  }
  return argon2.hash(plainText, ARGON2_OPTIONS);
}

/**
 * Vérifie un mot de passe candidat contre un hash Argon2id existant
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) {
    return false;
  }
  try {
    return await argon2.verify(hash, plainText);
  } catch (error) {
    return false;
  }
}
