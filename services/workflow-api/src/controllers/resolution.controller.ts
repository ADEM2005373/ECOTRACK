import { Request, Response } from 'express';
import { AuditLogModel } from '@ecotrack/db';
import { AuditAction, ReportStatus, UserRole } from '@ecotrack/shared';
import {
  stateMachineService,
  WorkflowError
} from '../services/state-machine.service';
import { publishReportResolved } from '../services/rabbitmq.publisher';
import { truncateIp } from '../utils/ip';

export class ResolutionController {
  async resolve(req: Request, res: Response) {
    try {
      const reportId = req.params.id || req.body.reportId;
      const completionPhotoUrl =
        req.body.completionImageUrl ||
        req.body.completionPhotoUrl ||
        req.body.afterPhotoUrl;
      const actorRole =
        (req as any).user?.role ||
        req.header('x-user-role') ||
        req.body.actorRole ||
        req.body.role;
      const actorId =
        (req as any).user?.id ||
        req.header('x-user-id') ||
        req.body.actorId ||
        req.body.userId;

      if (!completionPhotoUrl) {
        return res.status(400).json({
          statusCode: 400,
          error: 'VALIDATION_ERROR',
          message: 'La photo après travaux est obligatoire pour clôturer le chantier.'
        });
      }

      const report = await stateMachineService.executeTransition({
        reportId,
        transition: 'T4',
        targetStatus: 'RESOLU',
        actorRole,
        actorId,
        reason: req.body.comment || req.body.reason,
        completionPhotoUrl
      });

      const startedAt = report.startedAt
        ? new Date(report.startedAt).getTime()
        : new Date(report.createdAt).getTime();
      const resolvedAt = report.resolvedAt
        ? new Date(report.resolvedAt).getTime()
        : Date.now();
      const mttrHours = Number(
        Math.max(0, (resolvedAt - startedAt) / 3600000).toFixed(2)
      );

      try {
        await AuditLogModel.create({
          actorId: actorId || 'unknown-worker',
          actorRole: actorRole || UserRole.OUVRIER,
          action: AuditAction.REPORT_RESOLVED_T4,
          entityType: 'Intervention',
          entityId: report.id,
          before: { status: 'EN_TRAITEMENT' },
          after: {
            status: ReportStatus.RESOLU,
            completionPhotoUrl,
            mttrHours
          },
          reason: req.body.comment || req.body.reason,
          ipTruncated: truncateIp(req.ip),
          userAgent: req.header('user-agent')
        });
      } catch (auditError: any) {
        console.error('[WORKFLOW-API] Failed to write resolution audit:', auditError.message);
      }

      void publishReportResolved(report).catch((err) => {
        console.error('[WORKFLOW-API] Failed to publish report.resolved:', err.message);
      });

      return res.status(200).json({ ...report, mttrHours });
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
      message: err.message || 'Erreur lors de la clôture du chantier.'
    });
  }
}

export const resolutionController = new ResolutionController();
