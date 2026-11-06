import express, { Request, Response } from 'express';
import { uploadRouter } from './routes/upload.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'media-api',
    ticket: 'SCRUM-47',
    code: 'ECO-21',
    exifPurge: 'sharp.withMetadata(false)',
    s3Engine: '@aws-sdk/client-s3 (PutObjectCommand)',
    timestamp: new Date()
  });
});

// Montage des routes d'upload
app.use('/api/v1/media', uploadRouter);
app.use('/media', uploadRouter);

export async function startServer() {
  return app.listen(PORT, () => {
    console.log(`[MEDIA-API] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Media API:', err);
    process.exit(1);
  });
}

export { app };
