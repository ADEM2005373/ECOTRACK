/**
 * EcoTrack V2 - Types & Enums Utilisateurs
 * Sprint 1: SCRUM-42 / ECO-11
 */

export enum UserRole {
  ADMIN_SAAS = 'ADMIN_SAAS',                 // Admin SaaS (Admin Global multi-tenant)
  ADMIN_MUNICIPALITE = 'ADMIN_MUNICIPALITE', // Admin Municipalité ou Mairie
  AGENT_MAIRIE = 'AGENT_MAIRIE',             // Agent Mairie (gère réclamations, alertes, types, qualification)
  CHEF_OUVRIER = 'CHEF_OUVRIER',             // Chef Ouvrier Mobile (envoie ouvriers sur site & capture photo après travaux)
  CITOYEN = 'CITOYEN',                       // Citoyen (création réclamations & suivi)

  // Aliases de compatibilité ascendante
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  OUVRIER = 'OUVRIER'
}

export interface IMunicipalityTerritory {
  center: [number, number];
  bbox: [number, number, number, number];
  displayName?: string;
  polygon?: [number, number][];
}

export interface IUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  municipality?: string; // Mairie ou collectivité de rattachement
  territory?: IMunicipalityTerritory;
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
  municipality?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: IUser;
}
