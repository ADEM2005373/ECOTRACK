import express, { Request, Response } from 'express';
import { connectMongo } from '@ecotrack/db';
import { reportRouter } from './routes/report.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Healthcheck pour l'API Gateway Nginx et Docker
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'report-api',
    timestamp: new Date()
  });
});

// Montage des routes officielles (OpenAPI /reports et /api/v1/reports)
app.use('/api/v1/reports', reportRouter);
app.use('/reports', reportRouter);

export async function startServer() {
  await connectMongo();
  return app.listen(PORT, () => {
    console.log(`[REPORT-API] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Report API:', err);
    process.exit(1);
  });
}

export { app };
