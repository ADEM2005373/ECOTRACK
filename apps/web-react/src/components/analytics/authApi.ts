export type LoginErrorKind =
  | 'invalid_credentials'
  | 'validation'
  | 'rate_limited'
  | 'unavailable'
  | 'network'
  | 'invalid_payload';

export class LoginError extends Error {
  constructor(readonly kind: LoginErrorKind) {
    super(`login_${kind}`);
    this.name = 'LoginError';
  }
}

/** What the page keeps in memory after login. The refresh token is dropped on purpose. */
export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  fullName: string;
  role: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** POST /auth/login answers AuthTokens (packages/shared/src/types/user.ts). */
export function parseLoginResponse(body: unknown, nowMs: number): AuthSession {
  if (!isRecord(body) || !isRecord(body.user)) {
    throw new LoginError('invalid_payload');
  }
  const { accessToken, expiresIn, user } = body;
  if (
    typeof accessToken !== 'string' ||
    accessToken === '' ||
    typeof expiresIn !== 'number' ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0 ||
    typeof user.role !== 'string' ||
    typeof user.fullName !== 'string'
  ) {
    throw new LoginError('invalid_payload');
  }
  return { accessToken, expiresAt: nowMs + expiresIn * 1000, fullName: user.fullName, role: user.role };
}

export function loginUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/auth/login`;
}

export async function login(apiBaseUrl: string, email: string, password: string): Promise<AuthSession> {
  let response: Response;
  try {
    response = await fetch(loginUrl(apiBaseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch {
    throw new LoginError('network');
  }
  if (response.status === 401) {
    throw new LoginError('invalid_credentials');
  }
  if (response.status === 400) {
    throw new LoginError('validation');
  }
  if (response.status === 429) {
    throw new LoginError('rate_limited');
  }
  if (!response.ok) {
    throw new LoginError('unavailable');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new LoginError('invalid_payload');
  }
  return parseLoginResponse(body, Date.now());
}
