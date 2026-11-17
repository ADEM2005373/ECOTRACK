import { generateKeyPairSync, KeyObject, sign } from 'node:crypto';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { createApp } from '../src/app';
import { BiApiConfig } from '../src/config';
import { Logger, LogFields } from '../src/logger';
import { PowerBiService } from '../src/powerbi/powerbi-client';

export const NOW_MS = Date.UTC(2026, 10, 17, 12, 0, 0);
export const NOW_S = Math.floor(NOW_MS / 1000);

export const WORKSPACE_ID = '11111111-1111-4111-8111-111111111111';
export const REPORT_ID = '22222222-2222-4222-8222-222222222222';
export const DATASET_ID = '33333333-3333-4333-8333-333333333333';
export const EMBED_URL = `https://app.powerbi.com/reportEmbed?reportId=${REPORT_ID}&groupId=${WORKSPACE_ID}`;
export const EMBED_TOKEN = 'H4sIAAAAAAAEAC2W-test-embed-token';

export const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
export const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });

export function publicKeyPem(key: KeyObject = keys.publicKey): string {
  return key.export({ type: 'spki', format: 'pem' }).toString();
}

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

export function validClaims(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sub: '672f08a0b9e1a2001c45a001',
    email: 'admin@example.test',
    role: 'ADMIN',
    fullName: 'Admin Test',
    iss: 'ecotrack-identity-api',
    iat: NOW_S - 60,
    exp: NOW_S + 840,
    ...overrides
  };
}

/** Signs like identity-api (RS256), with full control over header and claims for negative tests. */
export function signJwt(
  claims: Record<string, unknown>,
  header: Record<string, unknown> = { alg: 'RS256', typ: 'JWT' },
  privateKey: KeyObject = keys.privateKey
): string {
  const input = `${b64url(header)}.${b64url(claims)}`;
  const signature = sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
  return `${input}.${signature}`;
}

export function testConfig(overrides: Partial<BiApiConfig> = {}): BiApiConfig {
  return {
    port: 0,
    azure: { tenantId: WORKSPACE_ID, clientId: WORKSPACE_ID, clientSecret: 'test-secret-value' },
    workspaceId: WORKSPACE_ID,
    jwtPublicKey: keys.publicKey,
    rlsRoleMap: { ADMIN: ['Direction_Generale_DGS'] },
    reportIds: { operationnel: REPORT_ID },
    ...overrides
  };
}

export interface CapturedLog {
  level: 'info' | 'warn';
  event: string;
  fields: LogFields;
}

export function captureLogger(): { logger: Logger; entries: CapturedLog[] } {
  const entries: CapturedLog[] = [];
  return {
    entries,
    logger: {
      info: (event, fields = {}) => entries.push({ level: 'info', event, fields }),
      warn: (event, fields = {}) => entries.push({ level: 'warn', event, fields })
    }
  };
}

export function fakePowerBi(): jest.Mocked<PowerBiService> {
  return {
    getReport: jest.fn().mockResolvedValue({ embedUrl: EMBED_URL, datasetId: DATASET_ID }),
    generateToken: jest.fn().mockResolvedValue({ token: EMBED_TOKEN, expiresAt: new Date(NOW_MS + 3600_000) })
  };
}

export interface RunningApp {
  baseUrl: string;
  close(): Promise<void>;
}

/** Starts the real Express app on a random port; HTTP calls then use the built-in fetch. */
export async function startApp(
  powerBi: PowerBiService,
  logger: Logger,
  config: BiApiConfig = testConfig()
): Promise<RunningApp> {
  const app = createApp({ config, powerBi, logger, now: () => NOW_MS });
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
  };
}
