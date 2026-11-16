import { Request, Response } from 'express';
import { AuditLogModel } from '@ecotrack/db';
import { AuditAction, ReportStatus, UserRole } from '@ecotrack/shared';
import {
  stateMachineService,
  WorkflowError
} from '../services/state-machine.service';
import { truncateIp } from '../utils/ip';

export class ReopenController {
  async reopen(req: Request, res: Response) {
    try {
      const reportId = req.params.id || req.body.reportId;
      const reason = req.body.reopenReason || req.body.reason;
      const actorRole =
        (req as any).user?.role ||
        req.header('x-user-role') ||
        req.body.actorRole ||
        req.body.role;
      const actorId =
        (req as any).user?.id ||
        req.header('x-user-id') ||
        req.body.actorId ||
        req.body.userId ||
        'unknown-admin';

      const report = await stateMachineService.reopenReport({
        reportId,
        actorRole,
        actorId,
        reason
      });

      await AuditLogModel.create({
        actorId,
        actorRole: UserRole.ADMIN,
        action: AuditAction.REPORT_REOPENED,
        entityType: 'Report',
        entityId: reportId,
        before: { status: ReportStatus.RESOLU },
        after: { status: ReportStatus.ASSIGNE },
        reason,
        ipTruncated: truncateIp(req.ip),
        userAgent: req.header('user-agent')
      });

      return res.status(200).json(report);
    } catch (err: any) {
      return this.handleError(res, err);
    }
  }

  private handleError(res: Response, err: any) {
    if (err instanceof WorkflowError) {
      return res.status(err.statusCode).json({
        statusCode: err.statusCode,
        error: err.errorCode,
        message: err.message
      });
    }

    return res.status(500).json({
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Erreur lors de la réouverture du signalement.'
    });
  }
}

export const reopenController = new ReopenController();
