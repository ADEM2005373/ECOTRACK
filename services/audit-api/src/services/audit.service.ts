import { AuditLogModel } from '@ecotrack/db';
import { CreateAuditLogDto, IAuditLog, AuditQueryFilters } from '@ecotrack/shared';
import { truncateIp } from '../utils/ip-anonymizer';

export class AuditService {
  /**
   * Enregistre un nouvel événement d'audit immuable (Append-Only)
   */
  async logEvent(dto: CreateAuditLogDto): Promise<IAuditLog> {
    const ipTruncated = truncateIp(dto.ipAddress);

    const logEntry = new AuditLogModel({
      actorId: dto.actorId,
      actorRole: dto.actorRole,
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      before: dto.before,
      after: dto.after,
      reason: dto.reason,
      ipTruncated,
      userAgent: dto.userAgent,
      timestamp: new Date()
    });

    await logEntry.save();
    return logEntry.toJSON() as IAuditLog;
  }

  /**
   * Récupère les traces d'audit filtrées avec pagination (Réservé ADMIN)
   */
  async queryLogs(filters: AuditQueryFilters): Promise<{ logs: IAuditLog[]; total: number; page: number; limit: number }> {
    const query: any = {};

    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments(query)
    ]);

    return {
      logs: logs.map(l => l.toJSON() as IAuditLog),
      total,
      page,
      limit
    };
  }

  /**
   * Récupère l'historique d'audit spécifique à une entité (ex: cycle de vie d'un signalement)
   */
  async getEntityHistory(entityType: string, entityId: string): Promise<IAuditLog[]> {
    const logs = await AuditLogModel.find({ entityType, entityId }).sort({ timestamp: 1 });
    return logs.map(l => l.toJSON() as IAuditLog);
  }
}

export const auditService = new AuditService();
