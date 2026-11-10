/**
 * ECOTRACK V2 - Service Métier Signalements (SCRUM-49 / ECO-23)
 * 
 * ⚠️ RÈGLE DE GOUVERNANCE STRICTE :
 * Ce service est attribué exclusivement à SARA SAHIH.
 * Tout code temporaire écrit par un autre membre de l'équipe a été éliminé.
 * Ce service doit être implémenté par Sara Sahih via sa branche dédiée :
 *   git checkout -b feature/ECO-23-sara-report-creation
 */

import { IReport, ReportStatus } from '@ecotrack/shared';

export interface CreateReportDto {
  citizenId: string;
  title?: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  thumbnailUrl?: string;
  categorySuggested?: string;
  aiConfidenceScore?: number;
}

export interface QueryReportsDto {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  status?: ReportStatus;
  citizenId?: string;
  limit?: number;
}

export class ReportService {
  /**
   * Crée un nouveau signalement avec géolocalisation GeoJSON et statut NOUVEAU
   * Réservé à Sara Sahih (SCRUM-49 / ECO-23).
   */
  async createReport(_dto: CreateReportDto): Promise<IReport> {
    throw new Error(
      'Méthode non implémentée : réservée exclusivement à Sara Sahih pour le ticket SCRUM-49 (ECO-23).'
    );
  }

  /**
   * Recherche spatiale de proximité via index 2dsphere ($near)
   * Réservé à Sara Sahih (SCRUM-49 / ECO-23).
   */
  async findReports(_query: QueryReportsDto): Promise<IReport[]> {
    throw new Error(
      'Méthode non implémentée : réservée exclusivement à Sara Sahih pour le ticket SCRUM-49 (ECO-23).'
    );
  }

  /**
   * Récupère un signalement par son identifiant unique
   * Réservé à Sara Sahih (SCRUM-49 / ECO-23).
   */
  async getReportById(_id: string): Promise<IReport | null> {
    throw new Error(
      'Méthode non implémentée : réservée exclusivement à Sara Sahih pour le ticket SCRUM-49 (ECO-23).'
    );
  }
}

export const reportService = new ReportService();
