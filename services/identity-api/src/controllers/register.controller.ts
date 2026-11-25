import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { UserRole } from '@ecotrack/shared';

// Validation regex pour format d'email standard
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contrôleur officiel d'inscription citoyenne (SCRUM-43 / ECO-12)
 * Développé par Sara Sahih
 * 
 * - Valide la présence des champs et les contraintes de format
 * - Empêche l'escalade de privilèges en forçant le rôle UserRole.CITOYEN
 * - Exploite le hook Mongoose Argon2id d'ECO-11 pour le hachage sécurisé
 * - Renvoye HTTP 201 Created en cas de succès, HTTP 409 si doublon, HTTP 400 si invalide
 */
export async function registerController(req: Request, res: Response): Promise<Response> {
  try {
    const { email, password, fullName, phoneNumber } = req.body;

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

    // 4. Création sécurisée de l'utilisateur avec forçage systématique du rôle CITOYEN (non rattaché à une mairie)
    const user = await userService.createUser({
      email: email.trim().toLowerCase(),
      password,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : undefined,
      role: UserRole.CITOYEN
    });

    return res.status(201).json({
      message: 'Compte citoyen créé avec succès',
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
}
