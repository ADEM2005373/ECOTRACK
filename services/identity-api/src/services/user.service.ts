import { UserModel, IUserDocument } from '@ecotrack/db';
import { CreateUserDto, UserRole, IUser } from '@ecotrack/shared';
import { verifyPassword } from '../utils/hashing';

export class UserService {
  /**
   * Crée un nouvel utilisateur avec validation et hachage Argon2id automatique
   */
  async createUser(dto: CreateUserDto): Promise<IUser> {
    const existing = await UserModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw new Error(`Un compte existe déjà avec l'adresse e-mail: ${dto.email}`);
    }

    const user = new UserModel({
      email: dto.email,
      password: dto.password, // Le hook pre-save se charge du hachage Argon2id
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      municipality: dto.municipality,
      role: dto.role || UserRole.CITOYEN,
      isActive: true
    });

    await user.save();
    return user.toJSON() as IUser;
  }

  /**
   * Recherche un utilisateur par email en incluant son hash de mot de passe (pour l'authentification)
   */
  async findByEmailWithPassword(email: string): Promise<any> {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).select('+password +refreshTokenHash');
  }

  /**
   * Recherche un utilisateur par ID (sans secrets)
   */
  async findById(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id);
    return user ? (user.toJSON() as IUser) : null;
  }

  /**
   * Initialise automatiquement le compte Admin SaaS racine
   * Seul compte persistant par défaut (l'Admin SaaS peut créer ensuite toutes les collectivités et comptes).
   */
  async seedDefaultAdmin(): Promise<void> {
    const defaultAccounts = [
      {
        email: 'admin@ecotrack.tn',
        password: 'Admin2026!',
        fullName: 'Administrateur SaaS Principal',
        phoneNumber: '+216 71 000 000',
        role: UserRole.ADMIN_SAAS,
        municipality: 'Supervision Centrale'
      }
    ];

    for (const acc of defaultAccounts) {
      try {
        const existing = await UserModel.findOne({ email: acc.email });
        if (!existing) {
          const user = new UserModel({
            ...acc,
            isActive: true
          });
          await user.save();
          console.log(`[IDENTITY-API] ✅ Compte Admin SaaS racine initialisé: ${acc.email} (${acc.role})`);
        } else if (existing.role === 'ADMIN') {
          // Mise à niveau transparente du compte admin existant vers ADMIN_SAAS
          existing.role = UserRole.ADMIN_SAAS;
          await existing.save();
        }
      } catch (err) {
        console.warn(`[IDENTITY-API] ⚠️ Impossible d'initialiser ${acc.email}:`, err);
      }
    }
  }

  /**
   * Valide les identifiants email / password
   */
  async validateCredentials(email: string, plainTextPassword: string): Promise<IUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await this.findByEmailWithPassword(normalizedEmail);

    // Auto-création si un compte par défaut tente de se connecter pour la 1ère fois
    if (!user) {
      await this.seedDefaultAdmin();
      user = await this.findByEmailWithPassword(normalizedEmail);
    }

    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await user.comparePassword(plainTextPassword);
    if (!isMatch) {
      return null;
    }

    // Mise à jour de la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();

    return user.toJSON() as IUser;
  }

  /**
   * Met à jour le rôle d'un utilisateur (Réservé à l'administrateur)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<IUser | null> {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, runValidators: true }
    );
    return user ? (user.toJSON() as IUser) : null;
  }

  /**
   * Liste tous les utilisateurs enregistrés (sans les mots de passe)
   */
  async listUsers(): Promise<IUser[]> {
    const users = await UserModel.find({}, { password: 0, refreshTokenHash: 0 }).sort({ createdAt: -1 });
    return users.map(u => u.toJSON() as IUser);
  }

  /**
   * Supprime un utilisateur (interdit pour le compte ADMIN_SAAS racine)
   */
  async deleteUser(userId: string): Promise<boolean> {
    const user = await UserModel.findById(userId);
    if (!user) return false;
    if (user.role === UserRole.ADMIN_SAAS || user.email === 'admin@ecotrack.tn') {
      throw new Error("Impossible de supprimer le compte Administrateur SaaS racine.");
    }
    await UserModel.findByIdAndDelete(userId);
    return true;
  }
}

export const userService = new UserService();
