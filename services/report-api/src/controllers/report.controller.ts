import { Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { ReportStatus } from '@ecotrack/shared';

export class ReportController {
  /**
   * POST /reports
   * Création d'un signalement d'anomalie environnementale (SCRUM-49 / ECO-23)
   */
  async createReport(req: Request, res: Response) {
    try {
      const {
        citizenId,
        title,
        description,
        latitude,
        longitude,
        photoUrl,
        thumbnailUrl,
        categorySuggested,
        aiConfidenceScore
      } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Les coordonnées GPS (latitude et longitude) sont obligatoires.'
        });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Les coordonnées GPS doivent être des nombres valides.'
        });
      }

      const report = await reportService.createReport({
        citizenId: citizenId || 'anonymous_citizen',
        title,
        description: description || 'Signalement citoyen',
        latitude,
        longitude,
        photoUrl: photoUrl || '/storage/reports/default-placeholder.webp',
        thumbnailUrl,
        categorySuggested,
        aiConfidenceScore
      });

      return res.status(201).json(report);
    } catch (err: any) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: err.message || 'Impossible de créer le signalement.'
      });
    }
  }

  /**
   * GET /reports
   * Recherche spatiale (2dsphere $near) ou filtrage (OpenAPI 3.1.0)
   */
  async getReports(req: Request, res: Response) {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const radiusMeters = req.query.radiusMeters
        ? parseInt(req.query.radiusMeters as string, 10)
        : undefined;
      const status = req.query.status as ReportStatus | undefined;
      const citizenId = req.query.citizenId as string | undefined;

      const reports = await reportService.findReports({
        lat,
        lng,
        radiusMeters,
        status,
        citizenId
      });

      return res.status(200).json(reports);
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Erreur lors de la récupération des signalements.'
      });
    }
  }

  /**
   * GET /reports/:id
   */
  async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.findById(id);

      if (!report) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Signalement #${id} introuvable.`
        });
      }

      return res.status(200).json(report);
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message
      });
    }
  }
}

export const reportController = new ReportController();
