/**
 * Rate Limiter pour la protection brute-force du login (SCRUM-45 / ECO-14)
 * Utilise un compteur glissant en mémoire avec support d'extension Redis
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiterService {
  private readonly attempts = new Map<string, RateLimitRecord>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMinutes = 1) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  /**
   * Vérifie si une clé (IP ou email) a dépassé le seuil de requêtes
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return false;
    }

    if (now > record.resetTime) {
      this.attempts.delete(key);
      return false;
    }

    return record.count >= this.maxAttempts;
  }

  /**
   * Incrémente le compteur d'échecs
   */
  recordFailure(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
    } else {
      record.count += 1;
    }
  }

  /**
   * Réinitialise le compteur après succès
   */
  resetAttempts(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Nombre de tentatives restantes
   */
  getRemainingAttempts(key: string): number {
    const record = this.attempts.get(key);
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - record.count);
  }
}

export const loginRateLimiter = new RateLimiterService(5, 1);
