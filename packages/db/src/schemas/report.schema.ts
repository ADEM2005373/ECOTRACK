import { Schema, model, Document, Model } from 'mongoose';
import { IReport, ReportStatus } from '@ecotrack/shared';

export interface IReportDocument extends Omit<IReport, 'id'>, Document {}

/**
 * Schéma Mongoose pour les Signalements Citoyens (EcoTrack V2)
 * Indexation spatiale 2dsphere pour requêtes géographiques ($near, $geoWithin)
 * Sprint 2: SCRUM-46 / ECO-20
 */
export const ReportSchema = new Schema<IReportDocument>(
  {
    citizenId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      // GeoJSON standard : [longitude, latitude]
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords: number[]) {
            return (
              Array.isArray(coords) &&
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 && // Longitude
              coords[1] >= -90 &&
              coords[1] <= 90 // Latitude
            );
          },
          message: 'Les coordonnées doivent respecter le format GeoJSON [longitude, latitude].'
        }
      }
    },
    photoUrl: {
      type: String,
      required: true
    },
    thumbnailUrl: {
      type: String
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
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.NOUVEAU,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Index géospatial 2dsphere obligatoire pour les calculs de distance et cartes
ReportSchema.index({ location: '2dsphere' });
ReportSchema.index({ status: 1, createdAt: -1 });

export const ReportModel: Model<IReportDocument> = model<IReportDocument>('Report', ReportSchema);
