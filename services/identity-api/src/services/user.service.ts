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
   * Initialise automatiquement les 5 comptes types selon la matrice RBAC EcoTrack V2 :
   * 1. Admin SaaS (Global)
   * 2. Admin Municipalité / Mairie
   * 3. Agent Mairie (réclamations, alertes, types)
   * 4. Chef Ouvrier (mobile, dispatch terrain & photo après réparation)
   * 5. Citoyen (mobile, déclarations)
   */
  async seedDefaultAdmin(): Promise<void> {
    const defaultAccounts = [
      {
        email: 'admin@ecotrack.tn',
        password: 'Admin2026!',
        fullName: 'Administrateur SaaS Global',
        phoneNumber: '+216 71 000 000',
        role: UserRole.ADMIN_SAAS,
        municipality: 'Supervision Centrale'
      },
      {
        email: 'mairie.tunis@ecotrack.tn',
        password: 'Mairie2026!',
        fullName: 'Directeur Services Mairie Tunis',
        phoneNumber: '+216 71 111 222',
        role: UserRole.ADMIN_MUNICIPALITE,
        municipality: 'Municipalité de Tunis'
      },
      {
        email: 'agent.tunis@ecotrack.tn',
        password: 'Agent2026!',
        fullName: 'Agent Modérateur Mairie Tunis',
        phoneNumber: '+216 71 333 444',
        role: UserRole.AGENT_MAIRIE,
        municipality: 'Municipalité de Tunis'
      },
      {
        email: 'chef.ouvrier@ecotrack.tn',
        password: 'Ouvrier2026!',
        fullName: 'Karim Ben Salem (Chef Voirie)',
        phoneNumber: '+216 98 555 666',
        role: UserRole.CHEF_OUVRIER,
        municipality: 'Municipalité de Tunis'
      },
      {
        email: 'citoyen@ecotrack.tn',
        password: 'Citoyen2026!',
        fullName: 'Anis Mahjoub (Citoyen)',
        phoneNumber: '+216 22 777 888',
        role: UserRole.CITOYEN,
        municipality: 'Municipalité de Tunis'
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
          console.log(`[IDENTITY-API] ✅ Compte type créé: ${acc.email} (${acc.role})`);
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
}

export const userService = new UserService();
