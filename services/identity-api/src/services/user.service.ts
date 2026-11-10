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
      role: dto.role || UserRole.CITOYEN,
      isActive: true
    });

    await user.save();
    return user.toJSON() as IUser;
  }

  /**
   * Recherche un utilisateur par email en incluant son hash de mot de passe (pour l'authentification)
   */
  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
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
   * Valide les identifiants email / password
   */
  async validateCredentials(email: string, plainTextPassword: string): Promise<IUser | null> {
    const user = await this.findByEmailWithPassword(email);
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
