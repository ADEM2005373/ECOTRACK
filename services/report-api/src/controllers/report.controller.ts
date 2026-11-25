/**
 * ECOTRACK V2 - Contrôleur HTTP Signalements (SCRUM-49 / ECO-23)
 * Développé par Sara Sahih
 * 
 * Expose les endpoints REST pour la création et la consultation géospatiale des signalements.
 * - POST /reports (ou /api/v1/reports) : Création et émission 'report.created'
 * - GET /reports (ou /api/v1/reports)  : Recherche spatiale $near et liste filtrée
 * - GET /reports/:id (ou /api/v1/reports/:id) : Consultation d'un signalement
 */

import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export class ReportController {
  /**
   * POST /reports
   * Création d'un signalement citoyen (SCRUM-49 / ECO-23)
   * Émet l'événement asynchrone 'report.created' vers RabbitMQ
   */
  async createReport(req: Request, res: Response): Promise<Response> {
    try {
      const { description, location, latitude, longitude, imageUrl, photoUrl, reporterId, citizenId, category, municipality, district } = req.body;

      // 1. Validation de la description
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'La description du signalement est obligatoire.'
        });
      }

      // 2. Validation de l'image (imageUrl ou photoUrl)
      const validImageUrl = imageUrl || photoUrl;
      if (!validImageUrl || typeof validImageUrl !== 'string') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Une URL d\'image valide est obligatoire pour attester de l\'anomalie.'
        });
      }

      // 3. Validation de la géolocalisation (location.coordinates ou latitude & longitude)
      const hasCoordinates = location && Array.isArray(location.coordinates) && location.coordinates.length === 2;
      const hasLatLng = latitude !== undefined && longitude !== undefined;

      if (!hasCoordinates && !hasLatLng) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'La localisation géographique (location.coordinates ou latitude/longitude) est obligatoire.'
        });
      }

      // 4. Appel du service de persistance et émission de l'événement 'report.created'
      const report = await reportService.createReport({
        description: description.trim(),
        imageUrl: validImageUrl,
        location: hasCoordinates ? location : undefined,
        latitude: hasLatLng ? Number(latitude) : undefined,
        longitude: hasLatLng ? Number(longitude) : undefined,
        reporterId: reporterId || citizenId,
        category: category || 'DEPOT_SAUVAGE',
        municipality: municipality ? String(municipality).trim() : undefined,
        district: district ? String(district).trim() : undefined
      });

      return res.status(201).json({
        message: 'Signalement créé avec succès',
        eventEmitted: 'report.created',
        report
      });

    } catch (err: any) {
      return res.status(400).json({
        error: 'BAD_REQUEST',
        message: err.message || 'Données de signalement invalides.'
      });
    }
  }

  /**
   * GET /reports
   * Recherche géospatiale et filtrage des signalements
   */
  async getReports(req: Request, res: Response): Promise<Response> {
    try {
      const { lat, lng, near, radius, radiusMeters, status, citizenId, reporterId, category, limit } = req.query;

      const reports = await reportService.findReports({
        lat: lat ? parseFloat(String(lat)) : undefined,
        lng: lng ? parseFloat(String(lng)) : undefined,
        near: near ? String(near) : undefined,
        radiusMeters: radiusMeters ? parseInt(String(radiusMeters)) : radius ? parseInt(String(radius)) : undefined,
        status: status as any,
        citizenId: citizenId ? String(citizenId) : undefined,
        reporterId: reporterId ? String(reporterId) : undefined,
        category: category ? String(category) : undefined,
        limit: limit ? parseInt(String(limit)) : undefined
      });

      return res.status(200).json({
        count: reports.length,
        reports
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Erreur lors de la récupération des signalements.'
      });
    }
  }

  /**
   * GET /reports/:id
   * Consultation d'un signalement par son identifiant unique
   */
  async getReportById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);

      if (!report) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Le signalement avec l'identifiant ${id} est introuvable.`
        });
      }

      return res.status(200).json(report);
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Erreur lors de la consultation du signalement.'
      });
    }
  }

  /**
   * DELETE /reports/:id
   * Suppression définitive d'un signalement dans MongoDB
   */
  async deleteReport(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const success = await reportService.deleteReport(id);

      if (!success) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: `Le signalement avec l'identifiant ${id} est introuvable ou déjà supprimé.`
        });
      }

      return res.status(200).json({
        message: 'Signalement supprimé avec succès',
        id
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Erreur lors de la suppression du signalement.'
      });
    }
  }
}

export const reportController = new ReportController();
