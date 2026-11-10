import express, { Request, Response } from 'express';
import { mediaRouter } from './routes/media.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'media-service',
    engine: 'sharp',
    rgpdPurgeEnabled: true,
    timestamp: new Date()
  });
});

// Routes de médias
app.use('/api/v1/media', mediaRouter);
app.use('/media', mediaRouter);

export async function startServer() {
  return app.listen(PORT, () => {
    console.log(`[MEDIA-SERVICE] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Media Service:', err);
    process.exit(1);
  });
}

export { app };
