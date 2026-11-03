/**
 * EcoTrack V2 - Types & Enums Utilisateurs
 * Sprint 1: SCRUM-42 / ECO-11
 */

export enum UserRole {
  CITOYEN = 'CITOYEN',
  AGENT = 'AGENT',
  OUVRIER = 'OUVRIER',
  ADMIN = 'ADMIN'
}

export interface IUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser {
  password: string;
  refreshTokenHash?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: IUser;
}
