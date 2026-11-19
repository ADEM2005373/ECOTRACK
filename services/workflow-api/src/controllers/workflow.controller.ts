import { Request, Response } from 'express';
import { AuditLogModel } from '@ecotrack/db';
import {
  stateMachineService,
  WorkflowError
} from '../services/state-machine.service';

export class WorkflowController {
  async transition(req: Request, res: Response) {
    try {
      const reportId =
        req.params.id ||
        req.body.reportId ||
        req.body.interventionId ||
        req.body.id;
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

      const report = await stateMachineService.executeTransition({
        reportId,
        transition: req.body.transition || req.body.action,
        targetStatus: req.body.targetState || req.body.targetStatus,
        actorRole,
        actorId,
        reason: req.body.reason || req.body.reopenReason,
        teamId: req.body.teamId || req.body.assignedTeamId,
        assigneeId:
          req.body.assigneeId ||
          req.body.assignedWorkerId ||
          req.body.workerId,
        priority: req.body.priority,
        reviewValidated:
          req.body.reviewValidated === true ||
          req.body.review?.validated === true,
        completionPhotoUrl:
          req.body.completionPhotoUrl ||
          req.body.completionImageUrl ||
          req.body.afterPhotoUrl,
        categoryValidated:
          req.body.categoryValidated || req.body.confirmedCategory
      });

      try {
        const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
        const cleanIp = clientIp.replace(/^.*:/, '').trim();
        const ipParts = cleanIp.split('.');
        const ipTruncated = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : '127.0.0.0/24';

        const transitionCode = req.body.transition || req.body.action || 'TRANSITION';
        const isAssignment = transitionCode === 'T2' || transitionCode === 'T2_ASSIGN' || transitionCode === 'ASSIGN';
        const isRejection = transitionCode === 'T5' || transitionCode === 'T5_REJECT' || transitionCode === 'REJECT';

        const actionName = isAssignment ? 'REPORT_ASSIGNED' : isRejection ? 'REPORT_REJECTED' : 'REPORT_STATUS_CHANGED';
        const reasonText = isAssignment
          ? `Affectation à la brigade ${report.assignedTeamId || req.body.teamId} (Responsable: ${report.assignedWorkerId || req.body.assigneeId || 'Non spécifié'}, Priorité: ${report.priority || req.body.priority || 'HAUTE'})`
          : isRejection
            ? `Rejet du signalement : ${req.body.reason || 'Non justifié'}`
            : `Transition de statut vers ${report.status}`;

        await AuditLogModel.create({
          actorId: actorId || req.header('x-actor-id') || 'agent@mairie.tn',
          actorRole: actorRole || 'AGENT_MAIRIE',
          action: actionName,
          entityType: 'Report',
          entityId: report.id || String((report as any)._id),
          reason: reasonText,
          ipTruncated,
          userAgent: req.header('user-agent') || 'EcoTrack Desk Agent',
          after: {
            status: report.status,
            assignedTeamId: report.assignedTeamId,
            assignedWorkerId: report.assignedWorkerId,
            priority: report.priority,
            category: report.category,
            municipality: (report as any).municipality || req.header('x-user-municipality') || 'Mairie de Zarzouna'
          },
          timestamp: new Date()
        });
      } catch (auditErr: any) {
        console.error('[WORKFLOW-API] Audit log error:', auditErr.message);
      }

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
      message: err.message || 'Erreur interne du workflow.'
    });
  }
}

export const workflowController = new WorkflowController();
