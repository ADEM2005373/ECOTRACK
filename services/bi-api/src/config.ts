import { createPublicKey, KeyObject } from 'node:crypto';
import { REPORT_ID_ENV_VARS, REPORT_KEYS, ReportKey } from './reports';

/** EcoTrack roles that must never receive a Power BI embed token. */
export const DENIED_ROLES: readonly string[] = ['CITOYEN', 'OUVRIER'];

/** Roles that may be mapped to Power BI RLS roles in POWERBI_RLS_ROLE_MAP. */
export const MAPPABLE_ROLES: readonly string[] = ['ADMIN', 'AGENT'];

export type RlsRoleMap = Readonly<Record<string, readonly string[]>>;

export interface BiApiConfig {
  port: number;
  azure: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
  };
  workspaceId: string;
  jwtPublicKey: KeyObject;
  rlsRoleMap: RlsRoleMap;
  reportIds: Readonly<Partial<Record<ReportKey, string>>>;
}

/** Lists every invalid variable by name; never includes a value. */
export class ConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid bi-api configuration: ${issues.join('; ')}`);
    this.name = 'ConfigError';
  }
}

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PORT = 3006;

export function isGuid(value: string): boolean {
  return GUID_PATTERN.test(value);
}

type Env = Readonly<Record<string, string | undefined>>;

function readRequired(env: Env, name: string, issues: string[]): string {
  const value = env[name]?.trim() ?? '';
  if (value === '') {
    issues.push(`${name} is required`);
  }
  return value;
}

function readGuid(env: Env, name: string, issues: string[]): string {
  const value = readRequired(env, name, issues);
  if (value !== '' && !isGuid(value)) {
    issues.push(`${name} must be a GUID`);
  }
  return value;
}

function readPort(env: Env, issues: string[]): number {
  const raw = env.PORT?.trim();
  if (!raw) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    issues.push('PORT must be an integer between 1 and 65535');
    return DEFAULT_PORT;
  }
  return port;
}

/** Accepts a PEM with real newlines or with escaped "\n" (single-line .env value). */
function readPublicKey(env: Env, issues: string[]): KeyObject | null {
  const raw = readRequired(env, 'JWT_PUBLIC_KEY', issues);
  if (raw === '') {
    return null;
  }
  try {
    const key = createPublicKey(raw.replace(/\\n/g, '\n'));
    if (key.asymmetricKeyType !== 'rsa') {
      issues.push('JWT_PUBLIC_KEY must be an RSA public key');
      return null;
    }
    return key;
  } catch {
    issues.push('JWT_PUBLIC_KEY is not a valid PEM public key');
    return null;
  }
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim() !== '')
  );
}

function readRoleMap(env: Env, issues: string[]): RlsRoleMap {
  const raw = readRequired(env, 'POWERBI_RLS_ROLE_MAP', issues);
  if (raw === '') {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    issues.push('POWERBI_RLS_ROLE_MAP must be valid JSON');
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    issues.push('POWERBI_RLS_ROLE_MAP must be a JSON object');
    return {};
  }
  const map: Record<string, readonly string[]> = {};
  for (const [role, rlsRoles] of Object.entries(parsed)) {
    if (!MAPPABLE_ROLES.includes(role)) {
      issues.push(`POWERBI_RLS_ROLE_MAP key "${role}" is not allowed (allowed: ${MAPPABLE_ROLES.join(', ')})`);
      continue;
    }
    if (!isNonEmptyStringArray(rlsRoles)) {
      issues.push(`POWERBI_RLS_ROLE_MAP.${role} must be a non-empty array of role names`);
      continue;
    }
    map[role] = Object.freeze(rlsRoles.map((name) => name.trim()));
  }
  if (Object.keys(parsed).length === 0) {
    issues.push('POWERBI_RLS_ROLE_MAP must map at least one role');
  }
  return Object.freeze(map);
}

/** A missing report ID is allowed (that tab answers 503 REPORT_NOT_CONFIGURED); a malformed one is not. */
function readReportIds(env: Env, issues: string[]): Partial<Record<ReportKey, string>> {
  const ids: Partial<Record<ReportKey, string>> = {};
  for (const key of REPORT_KEYS) {
    const name = REPORT_ID_ENV_VARS[key];
    const value = env[name]?.trim() ?? '';
    if (value === '') {
      continue;
    }
    if (!isGuid(value)) {
      issues.push(`${name} must be a GUID`);
      continue;
    }
    ids[key] = value;
  }
  return Object.freeze(ids);
}

/** Reads and validates the whole configuration; throws ConfigError so the service refuses to start. */
export function loadConfig(env: Env): BiApiConfig {
  const issues: string[] = [];
  const port = readPort(env, issues);
  const tenantId = readGuid(env, 'AZURE_TENANT_ID', issues);
  const clientId = readGuid(env, 'AZURE_CLIENT_ID', issues);
  const clientSecret = readRequired(env, 'AZURE_CLIENT_SECRET', issues);
  const workspaceId = readGuid(env, 'POWERBI_WORKSPACE_ID', issues);
  const jwtPublicKey = readPublicKey(env, issues);
  const rlsRoleMap = readRoleMap(env, issues);
  const reportIds = readReportIds(env, issues);

  if (issues.length > 0 || jwtPublicKey === null) {
    throw new ConfigError(issues);
  }
  return {
    port,
    azure: { tenantId, clientId, clientSecret },
    workspaceId,
    jwtPublicKey,
    rlsRoleMap,
    reportIds
  };
}
