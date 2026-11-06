import mongoose from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  dbName?: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
}

export async function connectMongo(config?: DatabaseConfig): Promise<typeof mongoose> {
  const uri = config?.uri || process.env.MONGODB_URI || 'mongodb://ecotrack_admin:EcoTrackMongo2026!@localhost:27017/ecotrack_db?authSource=admin';
  const dbName = config?.dbName || process.env.MONGO_INITDB_DATABASE || 'ecotrack_db';

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  return mongoose.connect(uri, {
    dbName,
    maxPoolSize: config?.maxPoolSize || 10,
    serverSelectionTimeoutMS: config?.serverSelectionTimeoutMS || 5000
  });
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
