import { ConfigError, loadConfig } from '../src/config';
import { publicKeyPem, REPORT_ID, WORKSPACE_ID } from './helpers';

const TENANT_ID = '44444444-4444-4444-8444-444444444444';
const CLIENT_ID = '55555555-5555-4555-8555-555555555555';
const SECRET = 'placeholder-secret-for-tests';

function baseEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    AZURE_TENANT_ID: TENANT_ID,
    AZURE_CLIENT_ID: CLIENT_ID,
    AZURE_CLIENT_SECRET: SECRET,
    POWERBI_WORKSPACE_ID: WORKSPACE_ID,
    JWT_PUBLIC_KEY: publicKeyPem(),
    POWERBI_RLS_ROLE_MAP: '{"ADMIN":["Direction_Generale_DGS"]}',
    POWERBI_REPORT_ID_OPERATIONNEL: REPORT_ID,
    ...overrides
  };
}

function issuesOf(env: Record<string, string | undefined>): readonly string[] {
  try {
    loadConfig(env);
  } catch (error) {
    if (error instanceof ConfigError) {
      return error.issues;
    }
    throw error;
  }
  throw new Error('expected a ConfigError');
}

describe('loadConfig', () => {
  it('loads a complete configuration with the default port', () => {
    const config = loadConfig(baseEnv());
    expect(config.port).toBe(3006);
    expect(config.workspaceId).toBe(WORKSPACE_ID);
    expect(config.rlsRoleMap).toEqual({ ADMIN: ['Direction_Generale_DGS'] });
    expect(config.reportIds).toEqual({ operationnel: REPORT_ID });
    expect(config.jwtPublicKey.asymmetricKeyType).toBe('rsa');
  });

  it('accepts a single-line PEM with escaped newlines', () => {
    const singleLine = publicKeyPem().trim().replace(/\n/g, '\\n');
    expect(loadConfig(baseEnv({ JWT_PUBLIC_KEY: singleLine })).jwtPublicKey.asymmetricKeyType).toBe('rsa');
  });

  it.each([
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'POWERBI_WORKSPACE_ID',
    'JWT_PUBLIC_KEY',
    'POWERBI_RLS_ROLE_MAP'
  ])('refuses to start without %s', (name) => {
    expect(issuesOf(baseEnv({ [name]: undefined }))).toContain(`${name} is required`);
  });

  it('never puts a value in the error message', () => {
    const message = (() => {
      try {
        loadConfig(baseEnv({ AZURE_TENANT_ID: 'not-a-guid', POWERBI_RLS_ROLE_MAP: '{bad' }));
      } catch (error) {
        return (error as Error).message;
      }
      return '';
    })();
    expect(message).toContain('AZURE_TENANT_ID must be a GUID');
    expect(message).not.toContain('not-a-guid');
    expect(message).not.toContain(SECRET);
  });

  it('allows missing report IDs (the tab answers REPORT_NOT_CONFIGURED)', () => {
    expect(loadConfig(baseEnv({ POWERBI_REPORT_ID_OPERATIONNEL: undefined })).reportIds).toEqual({});
  });

  it('rejects a malformed report ID', () => {
    expect(issuesOf(baseEnv({ POWERBI_REPORT_ID_SLA: '../../admin' }))).toContain(
      'POWERBI_REPORT_ID_SLA must be a GUID'
    );
  });

  it.each([
    ['invalid JSON', '{ADMIN', 'POWERBI_RLS_ROLE_MAP must be valid JSON'],
    ['an array', '["ADMIN"]', 'POWERBI_RLS_ROLE_MAP must be a JSON object'],
    ['an empty object', '{}', 'POWERBI_RLS_ROLE_MAP must map at least one role'],
    ['an empty role list', '{"ADMIN":[]}', 'POWERBI_RLS_ROLE_MAP.ADMIN must be a non-empty array of role names'],
    ['a CITOYEN mapping', '{"CITOYEN":["X"]}', 'POWERBI_RLS_ROLE_MAP key "CITOYEN" is not allowed (allowed: ADMIN, AGENT)'],
    ['an OUVRIER mapping', '{"OUVRIER":["X"]}', 'POWERBI_RLS_ROLE_MAP key "OUVRIER" is not allowed (allowed: ADMIN, AGENT)']
  ])('rejects a role map that is %s', (_label, value, issue) => {
    expect(issuesOf(baseEnv({ POWERBI_RLS_ROLE_MAP: value }))).toContain(issue);
  });

  it('accepts an AGENT mapping added through the environment', () => {
    const config = loadConfig(
      baseEnv({ POWERBI_RLS_ROLE_MAP: '{"ADMIN":["Direction_Generale_DGS"],"AGENT":["Mairie_Arrondissement"]}' })
    );
    expect(config.rlsRoleMap.AGENT).toEqual(['Mairie_Arrondissement']);
  });

  it.each(['0', '70000', 'abc', '3006.5'])('rejects PORT=%s', (port) => {
    expect(issuesOf(baseEnv({ PORT: port }))).toContain('PORT must be an integer between 1 and 65535');
  });

  it('rejects a JWT_PUBLIC_KEY that is not a PEM key', () => {
    expect(issuesOf(baseEnv({ JWT_PUBLIC_KEY: 'not a key' }))).toContain('JWT_PUBLIC_KEY is not a valid PEM public key');
  });
});
