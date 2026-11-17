import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { loginRateLimiter } from '../services/rate-limiter.service';

/**
 * Contrôleur de connexion officielle EcoTrack V2 (SCRUM-45 / ECO-14)
 * Valide les identifiants avec Argon2id, applique le Rate Limiting et délivre des JWT RS256
 */
export async function loginController(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = (req as any).rateLimitKey || `${clientIp}:${email ? String(email).trim().toLowerCase() : 'anonymous'}`;

    // 1. Vérification du Rate Limiter (max 5 tentatives par minute)
    if (loginRateLimiter.isRateLimited(rateLimitKey)) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: 'Trop de tentatives de connexion échouées. Veuillez patienter 1 minute avant de réessayer.'
      });
    }

    // 2. Validation des paramètres obligatoires
    if (!email || !password) {
      loginRateLimiter.recordFailure(rateLimitKey);
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'L\'adresse e-mail et le mot de passe sont obligatoires.'
      });
    }

    // 3. Validation des identifiants avec Argon2id
    const user = await userService.validateCredentials(email, password);
    if (!user) {
      loginRateLimiter.recordFailure(rateLimitKey);
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Identifiants invalides (adresse e-mail ou mot de passe incorrect).'
      });
    }

    // 4. Réinitialisation du limiteur en cas de succès
    loginRateLimiter.resetAttempts(rateLimitKey);

    // 5. Génération des tokens JWT RS256 (Access Token 15 min + Refresh Token)
    const authTokens = tokenService.generateAuthTokens(user);

    return res.status(200).json(authTokens);
  } catch (err: any) {
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Erreur lors de la tentative de connexion.'
    });
  }
}

/**
 * Fournit la clé publique RSA pour validation JWT inter-services (ADR-02)
 */
export function getPublicKeyController(_req: Request, res: Response): Response {
  return res.json({
    algorithm: 'RS256',
    publicKey: tokenService.getPublicKey()
  });
}
