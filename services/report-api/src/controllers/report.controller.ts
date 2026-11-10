/**
 * ECOTRACK V2 - Contrôleur Signalements (SCRUM-49 / ECO-23)
 * 
 * ⚠️ RÈGLE DE GOUVERNANCE STRICTE :
 * Ce module est attribué exclusivement à SARA SAHIH.
 * Tout code temporaire écrit par un autre membre de l'équipe a été éliminé.
 * Ce contrôleur doit être implémenté par Sara Sahih via sa branche dédiée :
 *   git checkout -b feature/ECO-23-sara-report-creation
 */

import { Request, Response } from 'express';

export class ReportController {
  /**
   * POST /reports
   * Création d'un signalement d'anomalie environnementale (SCRUM-49 / ECO-23)
   * À implémenter par Sara Sahih.
   */
  async createReport(_req: Request, res: Response) {
    return res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      ticket: 'SCRUM-49 (ECO-23)',
      assignee: 'Sara Sahih',
      message: 'Ce contrôleur est en attente d\'implémentation par Sara Sahih. Aucun code de substitution par un autre membre n\'est autorisé.'
    });
  }

  /**
   * GET /reports
   * Recherche géospatiale des signalements à proximité ($near)
   * À implémenter par Sara Sahih.
   */
  async getReports(_req: Request, res: Response) {
    return res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      ticket: 'SCRUM-49 (ECO-23)',
      assignee: 'Sara Sahih',
      message: 'Ce contrôleur est en attente d\'implémentation par Sara Sahih.'
    });
  }

  /**
   * GET /reports/:id
   * Récupération détaillée d'un signalement par son identifiant
   * À implémenter par Sara Sahih.
   */
  async getReportById(_req: Request, res: Response) {
    return res.status(501).json({
      error: 'NOT_IMPLEMENTED',
      ticket: 'SCRUM-49 (ECO-23)',
      assignee: 'Sara Sahih',
      message: 'Ce contrôleur est en attente d\'implémentation par Sara Sahih.'
    });
  }
}

export const reportController = new ReportController();
