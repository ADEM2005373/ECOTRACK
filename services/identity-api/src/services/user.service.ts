import { UserModel, IUserDocument } from '@ecotrack/db';
import { CreateUserDto, UserRole, IUser } from '@ecotrack/shared';
import { verifyPassword } from '../utils/hashing';
import { resolveMunicipalityTerritory } from './geocoding.service';

export class UserService {
  /**
   * Crée un nouvel utilisateur avec validation, hachage Argon2id et résolution du territoire municipal
   */
  async createUser(dto: CreateUserDto & { territory?: any }): Promise<IUser> {
    const existing = await UserModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw new Error(`Un compte existe déjà avec l'adresse e-mail: ${dto.email}`);
    }

    let territory = dto.territory;
    if (!territory && dto.municipality) {
      // Réutiliser le territoire déjà résolu pour cette municipalité si disponible
      const sameMairie = await UserModel.findOne({
        municipality: dto.municipality.trim(),
        'territory.center': { $exists: true, $ne: [] }
      }).select('territory');

      if (sameMairie?.territory?.center?.length) {
        territory = sameMairie.territory;
      } else {
        territory = (await resolveMunicipalityTerritory(dto.municipality)) ?? undefined;
      }
    }

    const user = new UserModel({
      email: dto.email,
      password: dto.password, // Le hook pre-save se charge du hachage Argon2id
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      municipality: dto.municipality,
      ...(territory ? { territory } : {}),
      role: dto.role || UserRole.CITOYEN,
      isActive: true
    });

    await user.save();
    return user.toJSON() as IUser;
  }

  /**
   * S'assure qu'un utilisateur rattaché à une municipalité dispose bien de son territoire géolocalisé
   */
  async ensureUserTerritory(userId: string): Promise<any> {
    const user = await UserModel.findById(userId);
    if (!user || !user.municipality) return null;
    if (user.territory?.center?.length === 2) return user.territory;

    const resolved = await resolveMunicipalityTerritory(user.municipality);
    if (resolved) {
      user.territory = resolved;
      await user.save();
    }
    return resolved;
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
      },
      {
        email: 'adel@zarzouna.tn',
        password: 'Agent2026!',
        fullName: 'ADEL BEN ADEL',
        phoneNumber: '+216 72 500 100',
        role: UserRole.AGENT_MAIRIE,
        municipality: 'Mairie de Zarzouna'
      },
      {
        email: 'chef.voirie@zarzouna.tn',
        password: 'Chef2026!',
        fullName: 'Mohamed Ali Khemiri',
        phoneNumber: '+216 72 500 201',
        role: UserRole.CHEF_OUVRIER,
        municipality: 'Mairie de Zarzouna'
      },
      {
        email: 'chef.poidslourd@zarzouna.tn',
        password: 'Chef2026!',
        fullName: 'Tarek Jouini',
        phoneNumber: '+216 72 500 202',
        role: UserRole.CHEF_OUVRIER,
        municipality: 'Mairie de Zarzouna'
      },
      {
        email: 'ouvrier.voirie@zarzouna.tn',
        password: 'Ouvrier2026!',
        fullName: 'Ahmed Trabelsi',
        phoneNumber: '+216 72 500 203',
        role: UserRole.OUVRIER,
        municipality: 'Mairie de Zarzouna'
      },
      {
        email: 'ouvrier.espacesverts@zarzouna.tn',
        password: 'Ouvrier2026!',
        fullName: 'Sami Gharbi',
        phoneNumber: '+216 72 500 204',
        role: UserRole.OUVRIER,
        municipality: 'Mairie de Zarzouna'
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
