import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  uri?: string;
  dbName?: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
}

const DEFAULT_AUTH_URI = 'mongodb://ecotrack_admin:EcoTrackMongo2026!@localhost:27017/ecotrack_db?authSource=admin';
const DEFAULT_NO_AUTH_URI = 'mongodb://localhost:27017/ecotrack_db';

export async function connectMongo(config?: DatabaseConfig): Promise<typeof mongoose> {
  const primaryUri = config?.uri || process.env.MONGODB_URI || DEFAULT_AUTH_URI;
  const dbName = config?.dbName || process.env.MONGO_INITDB_DATABASE || 'ecotrack_db';

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    return await mongoose.connect(primaryUri, {
      dbName,
      maxPoolSize: config?.maxPoolSize || 10,
      serverSelectionTimeoutMS: config?.serverSelectionTimeoutMS || 5000
    });
  } catch (err: any) {
    console.warn(`[DB] Connection with primary URI failed: ${err.message}. Trying fallback...`);
    const fallbackUri = primaryUri.includes('@') ? DEFAULT_NO_AUTH_URI : DEFAULT_AUTH_URI;
    return await mongoose.connect(fallbackUri, {
      dbName,
      maxPoolSize: config?.maxPoolSize || 10,
      serverSelectionTimeoutMS: config?.serverSelectionTimeoutMS || 5000
    });
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
