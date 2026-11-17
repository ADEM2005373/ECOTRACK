import { NextFunction, Request, RequestHandler, Response } from 'express';
import { readBearerToken, verifyAccessToken } from '../auth/jwt';
import { BiApiConfig } from '../config';
import { Logger } from '../logger';
import { httpStatusFor, UpstreamError } from '../powerbi/errors';
import { PowerBiService } from '../powerbi/powerbi-client';
import { isReportKey } from '../reports';
import { buildEffectiveIdentity, rlsRolesFor } from '../rls';

export interface EmbedControllerDeps {
  config: BiApiConfig;
  powerBi: PowerBiService;
  logger: Logger;
  now: () => number;
}

/** GET /api/v1/bi/embed-token response (SCRUM-53). Nothing else is ever sent. */
export interface EmbedTokenResponse {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  expiresAt: string;
}

function sendError(res: Response, status: number, error: string): void {
  res.status(status).json({ error });
}

/**
 * GET /api/v1/bi/embed-token?report=<key>
 * Order: 401 (token) -> 403 (role / RLS mapping) -> 400 (report key) -> 503 (not configured)
 * -> Power BI. The RLS identity comes only from the verified token; the request
 * body and every other query parameter are ignored.
 */
export function createEmbedTokenHandler(deps: EmbedControllerDeps): RequestHandler {
  const { config, powerBi, logger, now } = deps;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const bearer = readBearerToken(req.headers.authorization);
    const user = bearer === null ? null : verifyAccessToken(bearer, config.jwtPublicKey, Math.floor(now() / 1000));
    if (user === null) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      sendError(res, 401, 'UNAUTHORIZED');
      return;
    }

    const rlsRoles = rlsRolesFor(user.role, config.rlsRoleMap);
    if (rlsRoles === null) {
      logger.warn('embed_token_forbidden', { role: user.role });
      sendError(res, 403, 'FORBIDDEN');
      return;
    }

    const reportKey = req.query.report;
    if (!isReportKey(reportKey)) {
      sendError(res, 400, 'UNKNOWN_REPORT');
      return;
    }

    const reportId = config.reportIds[reportKey];
    if (reportId === undefined) {
      sendError(res, 503, 'REPORT_NOT_CONFIGURED');
      return;
    }

    try {
      const report = await powerBi.getReport(config.workspaceId, reportId);
      const identity = buildEffectiveIdentity(user, rlsRoles, report.datasetId);
      const embedToken = await powerBi.generateToken({ reportId, datasetId: report.datasetId, identity });

      const body: EmbedTokenResponse = {
        reportId,
        embedUrl: report.embedUrl,
        accessToken: embedToken.token,
        expiresAt: embedToken.expiresAt.toISOString()
      };
      logger.info('embed_token_issued', { report: reportKey, role: user.role });
      res.status(200).json(body);
    } catch (error) {
      if (!(error instanceof UpstreamError)) {
        next(error);
        return;
      }
      const mapping = httpStatusFor(error);
      logger.warn('embed_token_upstream_error', {
        report: reportKey,
        code: error.code,
        upstreamStatus: error.upstreamStatus
      });
      if (mapping.retryAfterSeconds !== null) {
        res.setHeader('Retry-After', String(mapping.retryAfterSeconds));
      }
      sendError(res, mapping.status, error.code);
    }
  };
}
