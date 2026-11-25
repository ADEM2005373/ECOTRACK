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
import { ReportModel, UserModel } from '@ecotrack/db';
import { IReport, ReportStatus, UserRole } from '@ecotrack/shared';
import { eventService } from './event.service';

function normalizePlaceName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(mairie|commune|municipalite|municipalité|delegation|délégation|ville|de|du|d'|l')\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function resolveMunicipalityByLocation(
  lat: number,
  lng: number
): Promise<{
  municipality: string;
  district?: string;
  mairieCovered: boolean;
  detectedLocality: string;
}> {
  let detectedLocality = '';
  let detectedDistrict: string | undefined;
  const candidateNames: string[] = [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`,
      {
        headers: { 'User-Agent': 'EcoTrack-Report-Router/1.0', 'Accept-Language': 'fr' },
        signal: controller.signal
      }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        address?: Record<string, string | undefined>;
      };
      const addr = data.address || {};
      const rawLocality =
        addr.municipality ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        addr.county ||
        addr.state ||
        data.name ||
        '';
      detectedLocality = rawLocality.trim();
      detectedDistrict = (addr.suburb || addr.neighbourhood || addr.quarter || addr.road || '').trim() || undefined;

      for (const field of [
        addr.municipality,
        addr.city,
        addr.town,
        addr.village,
        addr.suburb,
        addr.city_district,
        addr.county,
        addr.state_district
      ]) {
        if (field && field.trim()) {
          candidateNames.push(normalizePlaceName(field));
        }
      }
    }
  } catch {
    // Nominatim indisponible : on s'appuie uniquement sur les territoires en base
  }

  const activeMairies = await UserModel.find({
    role: UserRole.ADMIN_MUNICIPALITE,
    isActive: { $ne: false }
  })
    .select('municipality territory')
    .lean();

  // 1. Correspondance par nom de localité (Nominatim <-> compte Mairie)
  for (const m of activeMairies) {
    const mName = (m as any).municipality as string | undefined;
    if (!mName) continue;
    const normMairie = normalizePlaceName(mName);
    if (!normMairie) continue;
    if (
      candidateNames.some(
        (c) => c && (c === normMairie || c.includes(normMairie) || normMairie.includes(c))
      )
    ) {
      return {
        municipality: mName,
        district: detectedDistrict,
        mairieCovered: true,
        detectedLocality: detectedLocality || mName
      };
    }
  }

  // 2. Correspondance par bounding box du territoire de la mairie
  for (const m of activeMairies) {
    const mName = (m as any).municipality as string | undefined;
    const bbox = (m as any).territory?.bbox as number[] | undefined;
    if (!mName || !Array.isArray(bbox) || bbox.length !== 4) continue;
    const [south, north, west, east] = bbox;
    if (lat >= south && lat <= north && lng >= west && lng <= east) {
      return {
        municipality: mName,
        district: detectedDistrict,
        mairieCovered: true,
        detectedLocality: detectedLocality || mName
      };
    }
  }

  // 3. Correspondance par proximité du centre du territoire (<= 10 km)
  let closest: { name: string; dist: number } | null = null;
  for (const m of activeMairies) {
    const mName = (m as any).municipality as string | undefined;
    const center = (m as any).territory?.center as number[] | undefined;
    if (!mName || !Array.isArray(center) || center.length !== 2) continue;
    const dist = haversineKm(lat, lng, center[0], center[1]);
    if (dist <= 10 && (!closest || dist < closest.dist)) {
      closest = { name: mName, dist };
    }
  }
  if (closest) {
    return {
      municipality: closest.name,
      district: detectedDistrict,
      mairieCovered: true,
      detectedLocality: detectedLocality || closest.name
    };
  }

  // Aucune mairie inscrite sur EcoTrack pour cette localisation
  const fallbackLocality = detectedLocality || 'cette commune';
  return {
    municipality: fallbackLocality,
    district: detectedDistrict,
    mairieCovered: false,
    detectedLocality: fallbackLocality
  };
}

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
  aiJustification?: string;
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
  municipality?: string;
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

    // 4b. Analyse IA Vision réelle de la photo (si non déjà fournie)
    let aiConfidenceScore = dto.aiConfidenceScore;
    let categorySuggested = dto.categorySuggested;
    let aiJustification = dto.aiJustification;
    let aiDescription: string | undefined;
    let slaHours: number | undefined;
    let suggestedPriority: string | undefined;
    let suggestedBrigade: string | undefined;

    if (typeof aiConfidenceScore !== 'number' && imageUrl) {
      const visionBase = (process.env.AI_VISION_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const visionRes = await fetch(`${visionBase}/api/v1/vision/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, claimedCategory: category }),
          signal: controller.signal
        });
        clearTimeout(timer);
        if (visionRes.ok) {
          const data = (await visionRes.json()) as {
            confidence?: number;
            suggestedCategory?: string;
            justification?: string;
            aiDescription?: string;
            suggestedSlaHours?: number;
            suggestedPriority?: string;
            suggestedBrigade?: string;
          };
          if (typeof data.confidence === 'number') aiConfidenceScore = data.confidence;
          if (typeof data.suggestedCategory === 'string' && data.suggestedCategory.trim()) categorySuggested = data.suggestedCategory;
          if (typeof data.justification === 'string' && data.justification.trim()) aiJustification = data.justification;
          if (typeof data.aiDescription === 'string' && data.aiDescription.trim()) aiDescription = data.aiDescription;
          if (typeof data.suggestedSlaHours === 'number') slaHours = data.suggestedSlaHours;
          if (typeof data.suggestedPriority === 'string' && data.suggestedPriority.trim()) suggestedPriority = data.suggestedPriority;
          if (typeof data.suggestedBrigade === 'string' && data.suggestedBrigade.trim()) suggestedBrigade = data.suggestedBrigade;
        }
      } catch {
        // Ne jamais inventer un faux score de confiance si le service IA Vision est indisponible
      }
    }

    // 4c. Routage automatique vers la mairie correspondant à la localisation exacte du signalement
    const routed = await resolveMunicipalityByLocation(coordinates[1], coordinates[0]);

    // 5. Création et sauvegarde avec le modèle Mongoose officiel
    const reportDoc = new ReportModel({
      reporterId: reporterObjectId,
      category,
      description: dto.description || '',
      imageUrl,
      thumbnailUrl: dto.thumbnailUrl,
      categorySuggested,
      aiConfidenceScore,
      ...(aiJustification ? { aiJustification } : {}),
      ...(aiDescription ? { aiDescription } : {}),
      ...(typeof slaHours === 'number' ? { slaHours } : {}),
      ...(suggestedPriority ? { priority: suggestedPriority } : {}),
      ...(suggestedBrigade ? { assignedTeamId: suggestedBrigade } : {}),
      municipality: routed.municipality,
      mairieCovered: routed.mairieCovered,
      detectedLocality: routed.detectedLocality,
      ...(dto.district || routed.district ? { district: dto.district || routed.district } : {}),
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

    // Filtre par mairie / commune
    if (query.municipality && query.municipality.trim()) {
      const escaped = query.municipality.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.municipality = new RegExp(`^${escaped}$`, 'i');
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
