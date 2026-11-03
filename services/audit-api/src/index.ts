import express, { Request, Response } from 'express';
import { connectMongo } from '@ecotrack/db';
import { auditRouter } from './routes/audit.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;

// Healthcheck
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'audit-api', timestamp: new Date() });
});

// Montage des routes d'audit
app.use('/api/v1/audit', auditRouter);

export async function startServer() {
  await connectMongo();
  return app.listen(PORT, () => {
    console.log(`[AUDIT-API] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Audit API:', err);
    process.exit(1);
  });
}

export { app };
