import { Request, Response } from 'express';
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
        completionPhotoUrl:
          req.body.completionPhotoUrl ||
          req.body.completionImageUrl ||
          req.body.afterPhotoUrl,
        categoryValidated:
          req.body.categoryValidated || req.body.confirmedCategory
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
      message: err.message || 'Erreur interne du workflow.'
    });
  }
}

export const workflowController = new WorkflowController();
