/**
 * EcoTrack V2 - Types & Enums Audit & RGPD
 * Sprint 1: SCRUM-56 / ECO-15
 */

import { UserRole } from './user';

export enum AuditAction {
  // Authentification & Sécurité
  USER_REGISTER = 'USER_REGISTER',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_ROLE_UPDATED = 'USER_ROLE_UPDATED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Workflow des Signalements (Transitions Strictes T1 à T5)
  REPORT_CREATED = 'REPORT_CREATED',
  REPORT_VALIDATED_T1 = 'REPORT_VALIDATED_T1',
  REPORT_ASSIGNED_T2 = 'REPORT_ASSIGNED_T2',
  REPORT_STARTED_T3 = 'REPORT_STARTED_T3',
  REPORT_RESOLVED_T4 = 'REPORT_RESOLVED_T4',
  REPORT_REJECTED_T5 = 'REPORT_REJECTED_T5',
  REPORT_REOPENED = 'REPORT_REOPENED',

  // Actions d'Administration & Sécurité
  ADMIN_USER_DEACTIVATED = 'ADMIN_USER_DEACTIVATED',
  ADMIN_CONFIG_UPDATED = 'ADMIN_CONFIG_UPDATED',
  EXIF_PURGE_EXECUTED = 'EXIF_PURGE_EXECUTED'
}

export type AuditEntityType = 'User' | 'Report' | 'Intervention' | 'System' | 'Configuration';

export interface IAuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  action: AuditAction | string;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  ipTruncated: string; // Ex: 192.168.1.0/24 (Conformité RGPD)
  userAgent?: string;
  timestamp: Date;
}

export interface CreateAuditLogDto {
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  action: AuditAction | string;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryFilters {
  actorId?: string;
  action?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
