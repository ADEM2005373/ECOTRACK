/**
 * EcoTrack V2 - Types & Enums pour les Signalements Citoyens (Reports)
 * Sprint 2: SCRUM-46 / ECO-20 & SCRUM-47 / ECO-21
 */

export enum ReportStatus {
  NOUVEAU = 'NOUVEAU',
  EN_COURS_DE_VALIDATION = 'EN_COURS_DE_VALIDATION',
  REJETE = 'REJETE',
  VALIDE = 'VALIDE',
  ASSIGNE = 'ASSIGNE',
  EN_TRAITEMENT = 'EN_TRAITEMENT',
  RESOLU = 'RESOLU'
}

export interface GeoLocation {
  type: 'Point';
  /**
   * Coordonnées au standard GeoJSON RFC 7946 : [longitude, latitude]
   */
  coordinates: [number, number];
}

export interface IReport {
  id: string;
  citizenId: string;
  title: string;
  description: string;
  location: GeoLocation;
  photoUrl: string;
  thumbnailUrl?: string;
  categorySuggested?: string;
  categoryValidated?: string;
  aiConfidenceScore?: number;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportDto {
  citizenId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
}

export interface MediaUploadResponse {
  mediaId: string;
  cleanUrl: string;
  aiThumbnailUrl: string;
  metadataPurged: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  sizeBytes: number;
}
