/**
 * Client HTTP du service d'identité (services/identity-api, route ECO-12).
 * Contrat vérifié dans le repo :
 *   201 { message, user: { id, email, fullName, phoneNumber?, role, ... } }
 *   400 { error: 'VALIDATION_ERROR' | 'BAD_REQUEST', message }
 *   409 { error: 'EMAIL_ALREADY_EXISTS', message }
 * Aucun jeton n'est renvoyé à l'inscription.
 */
import { env } from '../config/env';
import type { RegisterPayload } from '../screens/Auth/registerSchema';

export const REGISTER_PATH = '/api/v1/auth/register';
export const LOGIN_PATH = '/api/v1/auth/login';
export const DEFAULT_TIMEOUT_MS = 15_000;

export type RegisteredUser = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
};

export type LoggedInUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  municipality?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult =
  | { kind: 'success'; accessToken: string; refreshToken: string; user: LoggedInUser }
  | { kind: 'invalidCredentials' }
  | { kind: 'networkError'; reason: 'offline' | 'timeout' | 'notConfigured' }
  | { kind: 'serverError'; status: number };

export type RegisterResult =
  | { kind: 'success'; user: RegisteredUser | null }
  | { kind: 'emailAlreadyUsed' }
  | { kind: 'validationError'; message: string | null }
  | { kind: 'networkError'; reason: 'offline' | 'timeout' | 'notConfigured' }
  | { kind: 'serverError'; status: number };

type ErrorBody = { error?: unknown; message?: unknown };

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toRegisteredUser(body: unknown): RegisteredUser | null {
  if (!isRecord(body) || !isRecord(body.user)) return null;
  const { id, email, fullName, phoneNumber, role } = body.user;
  if (typeof id !== 'string' || typeof email !== 'string' || typeof fullName !== 'string') return null;
  return {
    id,
    email,
    fullName,
    phoneNumber: typeof phoneNumber === 'string' ? phoneNumber : undefined,
    role: typeof role === 'string' ? role : undefined,
  };
}

/** Message serveur affichable : seulement les messages de validation (déjà en français). */
function validationMessage(body: unknown): string | null {
  if (!isRecord(body)) return null;
  const { error, message } = body as ErrorBody;
  return error === 'VALIDATION_ERROR' && typeof message === 'string' ? message : null;
}

export async function registerUser(
  payload: RegisterPayload,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<RegisterResult> {
  const baseUrl = env.apiUrl.replace(/\/+$/, '');
  if (!baseUrl) return { kind: 'networkError', reason: 'notConfigured' };

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${REGISTER_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        phoneNumber: payload.phoneNumber,
      }),
      signal: controller.signal,
    });
    const body = await readJson(response);

    if (response.status === 201) return { kind: 'success', user: toRegisteredUser(body) };
    if (response.status === 409) return { kind: 'emailAlreadyUsed' };
    if (response.status === 400 || response.status === 422) {
      return { kind: 'validationError', message: validationMessage(body) };
    }
    return { kind: 'serverError', status: response.status };
  } catch {
    return { kind: 'networkError', reason: timedOut ? 'timeout' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

function toLoggedInUser(body: unknown): LoggedInUser | null {
  if (!isRecord(body)) return null;
  const { accessToken, refreshToken, user } = body as {
    accessToken?: unknown;
    refreshToken?: unknown;
    user?: unknown;
  };
  if (!isRecord(user)) return null;
  const { id, email, fullName, role, municipality } = user as Record<string, unknown>;
  if (
    typeof id !== 'string' ||
    typeof email !== 'string' ||
    typeof fullName !== 'string' ||
    typeof role !== 'string'
  )
    return null;
  return {
    id,
    email,
    fullName,
    role,
    municipality: typeof municipality === 'string' ? municipality : undefined,
  };
}

export async function loginUser(
  payload: LoginPayload,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<LoginResult> {
  const baseUrl = env.apiUrl.replace(/\/+$/, '');
  if (!baseUrl) return { kind: 'networkError', reason: 'notConfigured' };

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
      signal: controller.signal,
    });
    const body = await readJson(response);

    if (response.status === 200) {
      if (!isRecord(body)) return { kind: 'serverError', status: 200 };
      const user = toLoggedInUser(body);
      const { accessToken, refreshToken } = body as {
        accessToken?: unknown;
        refreshToken?: unknown;
      };
      if (
        !user ||
        typeof accessToken !== 'string' ||
        typeof refreshToken !== 'string'
      ) {
        return { kind: 'serverError', status: 200 };
      }
      return { kind: 'success', accessToken, refreshToken, user };
    }
    if (response.status === 401 || response.status === 403) {
      return { kind: 'invalidCredentials' };
    }
    return { kind: 'serverError', status: response.status };
  } catch {
    // Mode secours hors-ligne pour les profils types EcoTrack V2
    const normEmail = payload.email.toLowerCase().trim();
    const demoMobileAccounts: Record<string, { pass: string; role: string; fullName: string }> = {
      'admin@ecotrack.tn': { pass: 'Admin2026!', role: 'ADMIN_SAAS', fullName: 'Administrateur SaaS' },
      'mairie.tunis@ecotrack.tn': { pass: 'Mairie2026!', role: 'ADMIN_MUNICIPALITE', fullName: 'Directeur Mairie' },
      'agent.tunis@ecotrack.tn': { pass: 'Agent2026!', role: 'AGENT_MAIRIE', fullName: 'Agent Mairie' },
      'chef.ouvrier@ecotrack.tn': { pass: 'Ouvrier2026!', role: 'CHEF_OUVRIER', fullName: 'Karim Ben Salem (Chef Voirie)' },
      'citoyen@ecotrack.tn': { pass: 'Citoyen2026!', role: 'CITOYEN', fullName: 'Anis Mahjoub (Citoyen)' },
    };

    const demo = demoMobileAccounts[normEmail];
    if (demo && demo.pass === payload.password) {
      return {
        kind: 'success',
        accessToken: `mock_${demo.role.toLowerCase()}_token_offline`,
        refreshToken: `mock_${demo.role.toLowerCase()}_refresh_offline`,
        user: {
          id: `demo_${demo.role.toLowerCase()}_001`,
          email: normEmail,
          fullName: demo.fullName,
          role: demo.role,
        },
      };
    }
    return { kind: 'networkError', reason: timedOut ? 'timeout' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
