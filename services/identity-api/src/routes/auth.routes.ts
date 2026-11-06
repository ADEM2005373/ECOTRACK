import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { UserRole } from '@ecotrack/shared';

const router = Router();

// Validation regex pour format d'email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /auth/register
 * Route d'inscription officielle EcoTrack V2
 * Conformité OpenAPI 3.1.0 et CDCF V2
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
    // Détection de conflit (e-mail déjà existant) -> Code HTTP 409
    if (err.message?.includes('existe déjà') || err.code === 11000) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: `Un compte existe déjà avec cette adresse e-mail.`
      });
    }

    return res.status(400).json({
      error: 'BAD_REQUEST',
      message: err.message || 'Données d\'inscription invalides.'
    });
  }
});

export const authRouter = router;
