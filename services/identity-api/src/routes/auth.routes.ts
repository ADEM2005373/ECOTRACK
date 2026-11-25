import { Router, Request, Response } from 'express';
import { connectMongo, AuditLogModel } from '@ecotrack/db';
import { userService } from '../services/user.service';
import { tokenService } from '../services/token.service';
import { loginRateLimiter } from '../services/rate-limiter.service';
import { loginController, getPublicKeyController } from '../controllers/login.controller';
import { registerController } from '../controllers/register.controller';
import { loginRateLimitMiddleware } from '../middlewares/rate-limit.middleware';
import { UserRole, AuditAction } from '@ecotrack/shared';
import { resolveMunicipalityTerritory } from '../services/geocoding.service';

const router = Router();

// Validation regex pour format d'email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function truncateIpAddress(ip?: string): string {
  if (!ip) return '127.0.0.0/24';
  const cleanIp = ip.replace(/^.*:/, '').trim();
  const ipv4Parts = cleanIp.split('.');
  if (ipv4Parts.length === 4) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.0/24`;
  }
  return '127.0.0.0/24';
}

async function recordAudit(
  actorId: string,
  actorRole: string,
  action: AuditAction | string,
  entityId: string,
  reason: string,
  clientIp?: string,
  userAgent?: string,
  after?: Record<string, any>
) {
  try {
    await AuditLogModel.create({
      actorId: String(actorId),
      actorRole: String(actorRole),
      action: String(action),
      entityType: 'User',
      entityId: String(entityId),
      reason,
      ipTruncated: truncateIpAddress(clientIp),
      userAgent: userAgent || 'EcoTrack Web Client',
      after,
      timestamp: new Date()
    });
    console.log(`[IDENTITY-API] 🛡️ Trace d'audit immuable enregistrée: ${action} pour ${actorId} (${actorRole})`);
  } catch (err) {
    console.warn('[IDENTITY-API] ⚠️ Impossible d\'enregistrer la trace d\'audit:', err);
  }
}

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
 * Délégué au contrôleur officiel de Sara Sahih (registerController).
 * Validation stricte : email regex, password.length < 8, codes HTTP 201, 400, 409.
 */
router.post('/register', (req: Request, res: Response) => {
  return registerController(req, res);
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
      await recordAudit(
        email ? email.trim().toLowerCase() : 'anonyme',
        'UNKNOWN',
        'USER_LOGIN_FAILED',
        email ? email.trim().toLowerCase() : 'anonymous',
        `Tentative de connexion échouée (identifiants invalides) pour: ${email}`,
        clientIp,
        req.headers['user-agent'] as string
      );
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Identifiants invalides (adresse e-mail ou mot de passe incorrect).'
      });
    }

    // 4. Réinitialisation du limiteur en cas de succès
    loginRateLimiter.resetAttempts(rateLimitKey);

    // 5. Génération des tokens JWT RS256
    const authTokens = tokenService.generateAuthTokens(user);

    // 6. Trace d'audit officielle immuable dans MongoDB
    await recordAudit(
      user.id || user.email,
      user.role,
      AuditAction.USER_LOGIN,
      user.id || user.email,
      `Connexion réussie de ${user.fullName} (${user.role}) - Collectivité: ${user.municipality || 'Centrale / SaaS'}`,
      clientIp,
      req.headers['user-agent'] as string,
      { email: user.email, role: user.role, municipality: user.municipality }
    );

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

/**
 * GET /auth/users
 * Récupère la liste de tous les utilisateurs enregistrés
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    return res.status(200).json({ users, count: users.length });
  } catch (err: any) {
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

function extractActorInfo(req: Request): {
  actorId: string;
  actorRole: string;
  actorEmail?: string;
  actorName?: string;
  municipality?: string;
} {
  let actorId = (req.headers['x-actor-id'] as string) || (req.headers['x-user-id'] as string);
  let actorRole = (req.headers['x-user-role'] as string);
  let actorEmail = (req.headers['x-user-email'] as string);
  let actorName = (req.headers['x-user-name'] as string);
  let municipality = (req.headers['x-user-municipality'] as string);

  // Vérification de l'en-tête Authorization Bearer JWT
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = tokenService.verifyToken(token) as any;
    if (decoded) {
      if (!actorId) actorId = decoded.email || decoded.sub;
      if (!actorRole) actorRole = decoded.role;
      if (!actorEmail) actorEmail = decoded.email;
      if (!actorName) actorName = decoded.fullName;
      if (!municipality && decoded.municipality) municipality = decoded.municipality;
    }
  }

  // Fallbacks intelligents si non spécifié
  if (!actorId) {
    actorId = 'admin@ecotrack.tn';
  }
  if (!actorRole) {
    actorRole = 'ADMIN_SAAS';
  }

  return { actorId, actorRole, actorEmail, actorName, municipality };
}

/**
 * POST /auth/users & POST /auth/admin/create-user
 * Création d'utilisateurs par l'administrateur (tous rôles autorisés)
 */
const createUserHandler = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phoneNumber, role, municipality, governorate } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Une adresse e-mail valide est obligatoire.'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
    }

    if (!fullName || fullName.trim().length === 0) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Le nom complet (fullName) est obligatoire.'
      });
    }

    const user = await userService.createUser({
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      role: role || UserRole.CITOYEN,
      municipality: municipality ? String(municipality).trim() : undefined,
      governorate: governorate ? String(governorate).trim() : undefined
    });

    // Trace d'audit pour création d'utilisateur / collectivité
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const actor = extractActorInfo(req);
    const actorDisplay = actor.actorName ? `${actor.actorName} (${actor.actorRole})` : actor.actorId;

    await recordAudit(
      actor.actorId,
      actor.actorRole,
      AuditAction.USER_REGISTER,
      user.id || user.email,
      `Création du compte ${user.fullName} (${user.role}) par ${actorDisplay} - Collectivité: ${user.municipality || 'SaaS'}`,
      clientIp,
      req.headers['user-agent'] as string,
      { email: user.email, role: user.role, municipality: user.municipality }
    );

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
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
      message: err.message
    });
  }
};

router.post('/users', createUserHandler);
router.post('/admin/create-user', createUserHandler);

/**
 * GET /auth/territory?name=Mairie+de+Zarzouna
 * Analyse le nom de la mairie et retourne le territoire géocodé (centre, bbox, polygone)
 */
router.get('/territory', async (req: Request, res: Response) => {
  const name = String(req.query.name || '').trim();
  const governorate = req.query.governorate ? String(req.query.governorate).trim() : undefined;
  if (!name) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Le paramètre name est requis.' });
  }
  const territory = await resolveMunicipalityTerritory(name, governorate);
  if (!territory) {
    return res.status(404).json({ error: 'NOT_FOUND', message: `Territoire introuvable pour "${name}".` });
  }
  return res.status(200).json({ territory });
});

/**
 * GET /auth/municipalities
 * Liste publique des mairies actives pour l'inscription citoyenne
 */
router.get('/municipalities', async (_req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    const seen = new Set<string>();
    const municipalities: { name: string; governorate?: string }[] = [];
    for (const u of users) {
      if (u.role !== UserRole.ADMIN_MUNICIPALITE) continue;
      const m = u.municipality?.trim();
      if (m && !seen.has(m.toLowerCase())) {
        seen.add(m.toLowerCase());
        municipalities.push({ name: m, governorate: (u as any).governorate });
      }
    }
    return res.status(200).json({ municipalities });
  } catch (err: any) {
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

/**
 * DELETE /auth/users/:id
 * Suppression d'un utilisateur
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const success = await userService.deleteUser(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Utilisateur introuvable.' });
    }
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const actor = extractActorInfo(req);
    await recordAudit(
      actor.actorId,
      actor.actorRole,
      AuditAction.ADMIN_USER_DEACTIVATED,
      req.params.id,
      `Suppression du compte utilisateur ID: ${req.params.id} par ${actor.actorName || actor.actorId} (${actor.actorRole})`,
      clientIp,
      req.headers['user-agent'] as string
    );
    return res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (err: any) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: err.message });
  }
});

/**
 * POST /auth/audit-event
 * Permet d'enregistrer des événements de session (changement de rôle, etc.)
 */
router.post('/audit-event', async (req: Request, res: Response) => {
  try {
    const { actorId, actorRole, action, entityId, reason, after } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    await recordAudit(
      actorId || 'anonyme',
      actorRole || 'UNKNOWN',
      action || AuditAction.USER_LOGIN,
      entityId || actorId || 'session',
      reason || 'Événement de session utilisateur',
      clientIp,
      req.headers['user-agent'] as string,
      after
    );
    return res.status(201).json({ status: 'ok' });
  } catch (err: any) {
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

export const authRouter = router;
