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
export const DEFAULT_TIMEOUT_MS = 15_000;

export type RegisteredUser = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
};

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
