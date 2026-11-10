import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { UserRole, AuditQueryFilters } from '@ecotrack/shared';

export class AuditController {
  /**
   * GET /api/v1/audit/logs
   * Sécurisé : Accessible UNIQUEMENT aux utilisateurs avec le rôle ADMIN
   */
  async getLogs(req: Request, res: Response) {
    try {
      // Vérification du rôle injecté par le middleware JWT / Gateway
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'ACCES_REFUSE: La consultation des journaux d\'audit et traces de conformité est strictement réservée au rôle ADMIN.'
        });
      }

      const filters: AuditQueryFilters = {
        actorId: req.query.actorId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as any,
        entityId: req.query.entityId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20
      };

      const result = await auditService.queryLogs(filters);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/v1/audit/log
   * Ingestion interne d'événements d'audit
   */
  async createLog(req: Request, res: Response) {
    try {
      const { actorId, actorRole, action, entityType, entityId, before, after, reason } = req.body;

      if (!actorId || !actorRole || !action || !entityType || !entityId) {
        return res.status(400).json({ error: 'Champs obligatoires manquants pour l\'événement d\'audit.' });
      }

      // Extraction IP et User-Agent pour anonymisation
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'];

      const log = await auditService.logEvent({
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        before,
        after,
        reason,
        ipAddress,
        userAgent
      });

      return res.status(201).json(log);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/v1/audit/history/:entityType/:entityId
   */
  async getEntityHistory(req: Request, res: Response) {
    try {
      const { entityType, entityId } = req.params;
      const history = await auditService.getEntityHistory(entityType, entityId);
      return res.status(200).json({ entityType, entityId, history });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

export const auditController = new AuditController();
