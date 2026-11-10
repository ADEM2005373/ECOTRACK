import { ReportModel, IReportDocument } from '@ecotrack/db';
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
   */
  async createReport(dto: CreateReportDto): Promise<IReport> {
    if (!dto.citizenId) {
      throw new Error('Le citizenId est obligatoire pour déposer un signalement.');
    }
    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new Error('Les coordonnées GPS (latitude, longitude) sont obligatoires.');
    }
    if (!dto.photoUrl) {
      throw new Error('La photo (purgée EXIF) est obligatoire.');
    }

    const report = new ReportModel({
      citizenId: dto.citizenId,
      title: dto.title || `Signalement du ${new Date().toLocaleDateString('fr-FR')}`,
      description: dto.description || 'Signalement d\'anomalie urbaine',
      location: {
        type: 'Point',
        // Convention GeoJSON : [longitude, latitude]
        coordinates: [dto.longitude, dto.latitude]
      },
      photoUrl: dto.photoUrl,
      thumbnailUrl: dto.thumbnailUrl,
      categorySuggested: dto.categorySuggested,
      aiConfidenceScore: dto.aiConfidenceScore,
      status: ReportStatus.NOUVEAU
    });

    await report.save();
    return report.toJSON() as IReport;
  }

  /**
   * Recherche géospatiale avancée ($near / $maxDistance) ou filtrage par statut
   */
  async findReports(query: QueryReportsDto): Promise<IReport[]> {
    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.citizenId) {
      filter.citizenId = query.citizenId;
    }

    // Requête géospatiale 2dsphere si des coordonnées sont fournies
    if (query.lat !== undefined && query.lng !== undefined) {
      const radiusMeters = query.radiusMeters || 5000;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [query.lng, query.lat]
          },
          $maxDistance: radiusMeters
        }
      };
    }

    const limit = query.limit || 100;
    const docs = await ReportModel.find(filter).limit(limit).lean();

    return docs.map(doc => {
      const { _id, __v, ...rest } = doc as any;
      return {
        id: _id.toString(),
        ...rest
      } as IReport;
    });
  }

  /**
   * Récupère un signalement par son identifiant unique
   */
  async findById(id: string): Promise<IReport | null> {
    const doc = await ReportModel.findById(id).lean();
    if (!doc) return null;

    const { _id, __v, ...rest } = doc as any;
    return {
      id: _id.toString(),
      ...rest
    } as IReport;
  }

  /**
   * Met à jour le statut et la qualification d'un signalement
   */
  async updateReportStatus(
    id: string,
    status: ReportStatus,
    categoryValidated?: string
  ): Promise<IReport | null> {
    const updateData: any = { status };
    if (categoryValidated) {
      updateData.categoryValidated = categoryValidated;
    }

    const doc = await ReportModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!doc) return null;

    const { _id, __v, ...rest } = doc as any;
    return {
      id: _id.toString(),
      ...rest
    } as IReport;
  }
}

export const reportService = new ReportService();
