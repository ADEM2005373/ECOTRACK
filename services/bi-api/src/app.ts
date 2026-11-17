import express, { Express, NextFunction, Request, Response } from 'express';
import { createEmbedTokenHandler, EmbedControllerDeps } from './controllers/bi-embed.controller';

export function createApp(deps: EmbedControllerDeps): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'bi-api' });
  });

  app.get('/api/v1/bi/embed-token', createEmbedTokenHandler(deps));

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND' });
  });

  // Express needs the 4-argument signature to treat this as the error handler.
  app.use((_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    deps.logger.warn('unhandled_error');
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  });

  return app;
}
