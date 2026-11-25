/**
 * ECOTRACK V2 - Service Métier Signalements (SCRUM-49 / ECO-23)
 * Développé par Sara Sahih
 * 
 * Gestion du cycle de vie des signalements environnementaux :
 * - Création avec indexation géospatiale GeoJSON 2dsphere
 * - Requêtage spatial par proximité géographique ($near & $maxDistance)
 * - Émission de l'événement 'report.created' vers le bus RabbitMQ
 */

import mongoose, { Types } from 'mongoose';
import { ReportModel } from '@ecotrack/db';
import { IReport, ReportStatus } from '@ecotrack/shared';
import { eventService } from './event.service';

export interface CreateReportDto {
  citizenId?: string;
  reporterId?: string;
  category?: string;
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type?: string;
    coordinates: [number, number];
  };
  photoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  categorySuggested?: string;
  aiConfidenceScore?: number;
  municipality?: string;
  district?: string;
}

export interface QueryReportsDto {
  lat?: number;
  lng?: number;
  near?: string; // format: "lng,lat" ou "lat,lng"
  radiusMeters?: number;
  status?: ReportStatus;
  citizenId?: string;
  reporterId?: string;
  category?: string;
  limit?: number;
}

export class ReportService {
  /**
   * Crée un nouveau signalement avec géolocalisation GeoJSON et statut initial NOUVEAU
   * Émet l'événement RabbitMQ 'report.created'
   */
  async createReport(dto: CreateReportDto): Promise<IReport> {
    // 1. Résolution de l'identifiant du citoyen (reporterId)
    const rawReporterId = dto.reporterId || dto.citizenId;
    let reporterObjectId: Types.ObjectId;
    if (rawReporterId && mongoose.isValidObjectId(rawReporterId)) {
      reporterObjectId = new Types.ObjectId(rawReporterId);
    } else {
      reporterObjectId = new Types.ObjectId();
    }

    // 2. Résolution des coordonnées GeoJSON [longitude, latitude] (WGS84 RFC 7946)
    let coordinates: [number, number];
    if (dto.location && Array.isArray(dto.location.coordinates) && dto.location.coordinates.length === 2) {
      coordinates = [Number(dto.location.coordinates[0]), Number(dto.location.coordinates[1])];
    } else if (dto.longitude !== undefined && dto.latitude !== undefined) {
      coordinates = [Number(dto.longitude), Number(dto.latitude)];
    } else {
      coordinates = [2.3522, 48.8566]; // Paris / défaut WGS84
    }

    // 3. Image URL
    const imageUrl = dto.imageUrl || dto.photoUrl || 'https://storage.ecotrack.local/reports/default.webp';

    // 4. Catégorie
    const category = dto.category || 'DEPOT_SAUVAGE';

    // 5. Création et sauvegarde avec le modèle Mongoose officiel
    const reportDoc = new ReportModel({
      reporterId: reporterObjectId,
      category,
      description: dto.description || '',
      imageUrl,
      thumbnailUrl: dto.thumbnailUrl,
      categorySuggested: dto.categorySuggested,
      aiConfidenceScore: dto.aiConfidenceScore,
      ...(dto.municipality ? { municipality: dto.municipality } : {}),
      ...(dto.district ? { district: dto.district } : {}),
      location: {
        type: 'Point',
        coordinates
      },
      status: ReportStatus.NOUVEAU
    });

    const savedDoc = await reportDoc.save();
    const result = savedDoc.toJSON() as unknown as IReport;

    // 6. Émission asynchrone de l'événement 'report.created' vers RabbitMQ
    await eventService.emitReportCreated(result);

    return result;
  }

  /**
   * Recherche spatiale de proximité via index 2dsphere ($near) et filtres multi-critères
   */
  async findReports(query: QueryReportsDto): Promise<IReport[]> {
    const filter: Record<string, any> = {};

    // Filtre par statut
    if (query.status) {
      filter.status = query.status;
    }

    // Filtre par citoyen
    const reporter = query.reporterId || query.citizenId;
    if (reporter && mongoose.isValidObjectId(reporter)) {
      filter.reporterId = new Types.ObjectId(reporter);
    }

    // Filtre par catégorie
    if (query.category) {
      filter.category = query.category;
    }

    // Requête géospatiale de proximité 2dsphere avec $near et $maxDistance
    let lng: number | undefined = query.lng;
    let lat: number | undefined = query.lat;

    if (query.near && typeof query.near === 'string') {
      const parts = query.near.split(',').map(p => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        lng = parts[0];
        lat = parts[1];
      }
    }

    if (lng !== undefined && lat !== undefined && !isNaN(lng) && !isNaN(lat)) {
      const radiusInMeters = Number(query.radiusMeters) || 5000;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radiusInMeters
        }
      };
    }

    const maxResults = Number(query.limit) || 50;
    const docs = await ReportModel.find(filter).limit(maxResults);
    return docs.map(doc => doc.toJSON() as unknown as IReport);
  }

  /**
   * Récupère un signalement par son identifiant unique MongoDB
   */
  async getReportById(id: string): Promise<IReport | null> {
    if (!mongoose.isValidObjectId(id)) {
      return null;
    }
    const doc = await ReportModel.findById(id);
    return doc ? (doc.toJSON() as unknown as IReport) : null;
  }

  /**
   * Supprime un signalement par son identifiant unique MongoDB
   */
  async deleteReport(id: string): Promise<boolean> {
    if (!mongoose.isValidObjectId(id)) {
      return false;
    }
    const result = await ReportModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const reportService = new ReportService();
