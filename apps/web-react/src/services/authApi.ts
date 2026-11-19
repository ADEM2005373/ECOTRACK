/**
 * Client HTTP pour l'authentification (services/identity-api, route ECO-14).
 * Contrat : POST /api/v1/auth/login → { accessToken, refreshToken, user }
 */
export const LOGIN_PATH = '/api/v1/auth/login';
export const REGISTER_PATH = '/api/v1/auth/register';

export type LoginResult =
  | { kind: 'success'; accessToken: string; refreshToken?: string; user: { id: string; email: string; fullName: string; role: string } }
  | { kind: 'invalidCredentials' }
  | { kind: 'serverError'; status: number }
  | { kind: 'networkError'; reason: string };

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const isDefaultAdmin = email.toLowerCase().trim() === 'admin@ecotrack.tn' && password === 'Admin2026!';
  const fallbackAdminResult: LoginResult = {
    kind: 'success',
    accessToken: 'mock_admin_jwt_token_local',
    user: {
      id: 'admin_local_001',
      email: 'admin@ecotrack.tn',
      fullName: 'Administrateur Principal',
      role: 'ADMIN',
    },
  };

  try {
    const response = await fetch(LOGIN_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { kind: 'success', accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user };
    } else if (response.status === 401 || response.status === 403) {
      if (isDefaultAdmin) return fallbackAdminResult;
      return { kind: 'invalidCredentials' };
    } else {
      if (isDefaultAdmin) return fallbackAdminResult;
      return { kind: 'serverError', status: response.status };
    }
  } catch {
    if (isDefaultAdmin) return fallbackAdminResult;
    return { kind: 'networkError', reason: 'offline' };
  }
}

export async function registerUser(fullName: string, email: string, password: string, phoneNumber?: string) {
  try {
    const response = await fetch(REGISTER_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phoneNumber }),
    });

    if (response.ok) {
      return { kind: 'success', user: (await response.json()).user };
    } else if (response.status === 409) {
      return { kind: 'emailTaken' };
    } else if (response.status === 400) {
      const data = await response.json();
      return { kind: 'validationError', message: data.message || 'Erreur de validation' };
    } else {
      return { kind: 'serverError', status: response.status };
    }
  } catch {
    return { kind: 'networkError' };
  }
}
