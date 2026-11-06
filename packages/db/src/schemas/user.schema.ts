import { Schema, Model, model, Document } from 'mongoose';
import * as argon2 from 'argon2';
import { UserRole, IUserDocument } from '@ecotrack/shared';

// Paramètres de hachage Argon2id conformes aux recommandations OWASP et CDCF V2 (ECO-11)
export const ARGON2_CONFIG: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 itérations
  parallelism: 4     // 4 threads
};

export const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "L'adresse e-mail est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Format d'e-mail invalide"]
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit comporter au moins 8 caractères'],
      select: false // Protection : masqué par défaut dans les requêtes
    },
    fullName: {
      type: String,
      required: [true, 'Le nom complet est obligatoire'],
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CITOYEN,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    refreshTokenHash: {
      type: String,
      select: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshTokenHash;
        return ret;
      }
    }
  }
);

// Index d'unicité et de performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });

// Hook Mongoose Pre-Save : Hachage automatique avec Argon2id lors de la création ou modification
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const hash = await argon2.hash(this.password, ARGON2_CONFIG);
    this.password = hash;
    return next();
  } catch (err: any) {
    return next(err);
  }
});

// Méthode d'instance : Vérification du mot de passe candidat
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) {
    throw new Error('Le hash du mot de passe est manquant pour effectuer la vérification');
  }
  return argon2.verify(this.password, candidatePassword);
};

export const UserModel: Model<IUserDocument> = model<IUserDocument>('User', UserSchema);
