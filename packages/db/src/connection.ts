import mongoose from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  dbName?: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
}

export async function connectMongo(config?: DatabaseConfig): Promise<typeof mongoose> {
  const uri = config?.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/ecotrack_db';
  const dbName = config?.dbName || process.env.MONGO_INITDB_DATABASE || 'ecotrack_db';

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    return await mongoose.connect(uri, {
      dbName,
      maxPoolSize: config?.maxPoolSize || 10,
      serverSelectionTimeoutMS: config?.serverSelectionTimeoutMS || 5000
    });
  } catch (err: any) {
    if (err.message && (err.message.includes('Authentication failed') || err.message.includes('authSource'))) {
      console.warn('[DB] Auth failed with primary URI, falling back to local MongoDB without credentials...');
      return await mongoose.connect('mongodb://localhost:27017/ecotrack_db', {
        dbName,
        maxPoolSize: config?.maxPoolSize || 10,
        serverSelectionTimeoutMS: config?.serverSelectionTimeoutMS || 5000
      });
    }
    throw err;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
