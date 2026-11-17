import { Request, Response, NextFunction } from 'express';
import { loginRateLimiter } from '../services/rate-limiter.service';

/**
 * Middleware Express de limitation de débit anti brute-force (SCRUM-45 / ECO-14)
 * Limite à 5 tentatives échouées par minute par IP/compte
 */
export function loginRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : 'anonymous';
  const rateLimitKey = `${clientIp}:${email}`;

  if (loginRateLimiter.isRateLimited(rateLimitKey)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Trop de tentatives de connexion échouées. Veuillez patienter 1 minute avant de réessayer.'
    });
  }

  (req as any).rateLimitKey = rateLimitKey;
  next();
}
