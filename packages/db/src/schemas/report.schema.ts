import mongoose, { Schema, Document, Types } from 'mongoose';
import { IReport, GeoLocation, ReportStatus } from '@ecotrack/shared';

export interface IReportDocument extends Omit<IReport, 'id' | 'reporterId'>, Document {
  reporterId: Types.ObjectId;
}

// Vérifie un couple GeoJSON [longitude, latitude] : exactement 2 nombres finis dans les bornes WGS84
function isValidLngLat(coords: unknown): boolean {
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }
  const [lng, lat] = coords;
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

// Point GeoJSON strict (RFC 7946). L'ordre est [longitude, latitude], jamais [latitude, longitude].
const GeoPointSchema = new Schema<GeoLocation>(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      required: [true, 'Les coordonnées GPS sont obligatoires'],
      default: undefined, // Empêche Mongoose d'initialiser un tableau vide qui satisferait `required`
      validate: {
        validator: isValidLngLat,
        message: 'Les coordonnées doivent respecter le format GeoJSON [longitude, latitude] (longitude ∈ [-180, 180], latitude ∈ [-90, 90]).'
      }
    }
  },
  { _id: false }
);

/**
 * Schéma Mongoose pour les Signalements Citoyens (EcoTrack V2)
 * Indexation spatiale 2dsphere pour requêtes géographiques ($near, $geoWithin)
 * Sprint 2: SCRUM-46 / ECO-20
 */
export const ReportSchema = new Schema<IReportDocument>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'identifiant du citoyen (reporterId) est obligatoire"]
    },
    // Chaîne libre : les codes catégorie divergent encore entre le DW (Dim_Category) et le service IA
    category: {
      type: String,
      required: [true, 'La catégorie est obligatoire'],
      trim: true,
      maxlength: [50, 'La catégorie ne doit pas dépasser 50 caractères']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'La description ne doit pas dépasser 2000 caractères']
    },
    imageUrl: {
      type: String,
      required: [true, "L'URL de la photo est obligatoire"],
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    categorySuggested: {
      type: String,
      trim: true
    },
    categoryValidated: {
      type: String,
      trim: true
    },
    aiConfidenceScore: {
      type: Number,
      min: 0,
      max: 1
    },
    location: {
      type: GeoPointSchema,
      required: [true, 'La localisation GPS est obligatoire']
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.NOUVEAU,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { _id, __v, ...report } = ret;
        return { ...report, id: String(_id) };
      }
    }
  }
);

// Index géospatial 2dsphere obligatoire pour les calculs de distance et cartes
ReportSchema.index({ location: '2dsphere' });
// Filtre par statut (GET /reports?status=) et liste « Mes signalements » d'un citoyen
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

export const ReportModel = mongoose.model<IReportDocument>('Report', ReportSchema);
