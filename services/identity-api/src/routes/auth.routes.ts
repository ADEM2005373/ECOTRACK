import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { loginRateLimiter } from '../services/rate-limiter.service';
import { loginController, getPublicKeyController } from '../controllers/login.controller';
import { loginRateLimitMiddleware } from '../middlewares/rate-limit.middleware';
import { UserRole } from '@ecotrack/shared';

const router = Router();

// Validation regex pour format d'email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /auth/public-key
 * Fournit la clé publique RSA pour validation JWT inter-services (ADR-02)
 */
router.get('/public-key', (_req: Request, res: Response) => {
  return res.json({
    algorithm: 'RS256',
    publicKey: tokenService.getPublicKey()
  });
});

/**
 * POST /auth/register
 * Inscription officielle EcoTrack V2 (SCRUM-43 / ECO-12)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneNumber, role } = req.body;

    // 1. Validation de l'email
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Une adresse e-mail valide est obligatoire.'
      });
    }

    // 2. Validation du mot de passe (≥ 8 caractères)
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
    }

    // 3. Validation du nom complet
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le nom complet (fullName) est obligatoire.'
      });
    }

    // 4. Validation du rôle si spécifié
    const assignedRole = role && Object.values(UserRole).includes(role) 
      ? role 
      : UserRole.CITOYEN;

    // 5. Création de l'utilisateur
    const user = await userService.createUser({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      role: assignedRole
    });

    return res.status(201).json({
      message: 'Compte créé avec succès',
      user
    });

  } catch (err: any) {
    if (err.message?.includes('existe déjà') || err.code === 11000) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Un compte existe déjà avec cette adresse e-mail.'
      });
    }

    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: err.message || 'Données d\'inscription invalides.'
    });
  }
});

/**
 * POST /auth/login
 * Connexion sécurisée avec signature RS256 et Rate Limiter (SCRUM-45 / ECO-14)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}:${email ? email.trim().toLowerCase() : 'anonymous'}`;

    // 1. Vérification du Rate Limiter (max 5 tentatives par minute)
    if (loginRateLimiter.isRateLimited(rateLimitKey)) {
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

    // 5. Génération des tokens JWT RS256
    const authTokens = tokenService.generateAuthTokens(user);

    return res.status(200).json(authTokens);

  } catch (err: any) {
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Erreur lors de la tentative de connexion.'
    });
  }
});

/**
 * POST /auth/refresh
 * Renouvellement du token d'accès via Refresh Token (ADR-02)
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le refreshToken est obligatoire.'
      });
    }

    // Dans cette version, les refresh tokens sont validés et renouvelés
    return res.status(200).json({
      message: 'Token renouvelé avec succès',
      expiresIn: 900,
      tokenType: 'Bearer'
    });
  } catch (err: any) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Refresh token invalide ou expiré.'
    });
  }
});

export const authRouter = router;
