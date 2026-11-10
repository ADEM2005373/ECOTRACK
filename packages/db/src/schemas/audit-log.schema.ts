import { Schema, Model, model, Document } from 'mongoose';
import { IAuditLog, AuditAction, UserRole } from '@ecotrack/shared';

export interface IAuditLogDocument extends Omit<IAuditLog, 'id'>, Document {}

export const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: {
      type: String,
      required: [true, "L'identifiant de l'acteur (actorId) est obligatoire"],
      index: true
    },
    actorRole: {
      type: String,
      required: [true, "Le rôle de l'acteur est obligatoire"],
      index: true
    },
    action: {
      type: String,
      required: [true, "L'action d'audit est obligatoire"],
      index: true
    },
    entityType: {
      type: String,
      required: [true, "Le type d'entité est obligatoire"],
      index: true
    },
    entityId: {
      type: String,
      required: [true, "L'identifiant de l'entité ciblée est obligatoire"],
      index: true
    },
    before: {
      type: Schema.Types.Mixed,
      default: undefined
    },
    after: {
      type: Schema.Types.Mixed,
      default: undefined
    },
    reason: {
      type: String,
      trim: true
    },
    ipTruncated: {
      type: String,
      required: [true, "L'adresse IP tronquée (conformité RGPD) est obligatoire"],
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true, // Non modifiable après création
      index: true
    }
  },
  {
    timestamps: false, // Pas de updatedAt pour garantir l'immutabilité
    versionKey: false,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Index composés pour l'audit et la conformité RGPD
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// ==============================================================================
// VERROUILLAGE STRICT EN ÉCRITURE SEULE (APPEND-ONLY STRICT / RGPD)
// Interdiction absolue de toute modification ou suppression d'un événement d'audit
// ==============================================================================

const IMMUTABILITY_ERROR = new Error(
  'VIOLATION_CONFORMITE_RGPD: La collection AuditLogs est en écriture seule (Append-Only strict). Toute opération de modification (UPDATE) ou suppression (DELETE) est physiquement interdite.'
);

AuditLogSchema.pre('updateOne', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('updateMany', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('findOneAndUpdate', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('replaceOne', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('deleteOne', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('deleteMany', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('findOneAndDelete', function () {
  throw IMMUTABILITY_ERROR;
});

AuditLogSchema.pre('findOneAndReplace', function () {
  throw IMMUTABILITY_ERROR;
});

export const AuditLogModel: Model<IAuditLogDocument> = model<IAuditLogDocument>('AuditLog', AuditLogSchema);
