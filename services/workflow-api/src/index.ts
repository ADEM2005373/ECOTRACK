import express, { Request, Response } from 'express';
import { connectMongo } from '@ecotrack/db';
import { workflowRouter } from './routes/workflow.routes';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'workflow-api',
    timestamp: new Date()
  });
});

app.use('/api/v1/workflow', workflowRouter);
app.use('/api/v1/interventions', workflowRouter);
app.use('/api/v1/reports', workflowRouter);
app.use('/workflow', workflowRouter);
app.use('/interventions', workflowRouter);
app.use('/reports', workflowRouter);

export async function startServer() {
  await connectMongo();
  return app.listen(PORT, () => {
    console.log(`[WORKFLOW-API] Running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Workflow API:', err);
    process.exit(1);
  });
}

export { app };
