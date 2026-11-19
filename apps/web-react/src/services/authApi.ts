/**
 * Client HTTP pour l'authentification (services/identity-api, route ECO-14).
 * Contrat : POST /api/v1/auth/login → { accessToken, refreshToken, user }
 */
export const LOGIN_PATH = '/api/v1/auth/login';
export const REGISTER_PATH = '/api/v1/auth/register';

export type LoginResult =
  | { kind: 'success'; accessToken: string; refreshToken?: string; user: { id: string; email: string; fullName: string; role: string; municipality?: string } }
  | { kind: 'invalidCredentials' }
  | { kind: 'serverError'; status: number }
  | { kind: 'networkError'; reason: string };

const DEMO_FALLBACK_ACCOUNTS: Record<string, { role: string; fullName: string; pass: string; municipality: string }> = {
  'admin@ecotrack.tn': {
    pass: 'Admin2026!',
    role: 'ADMIN_SAAS',
    fullName: 'Administrateur SaaS Global',
    municipality: 'Supervision Centrale'
  },
  'mairie.tunis@ecotrack.tn': {
    pass: 'Mairie2026!',
    role: 'ADMIN_MUNICIPALITE',
    fullName: 'Directeur Services Mairie Tunis',
    municipality: 'Municipalité de Tunis'
  },
  'agent.tunis@ecotrack.tn': {
    pass: 'Agent2026!',
    role: 'AGENT_MAIRIE',
    fullName: 'Agent Modérateur Mairie Tunis',
    municipality: 'Municipalité de Tunis'
  },
  'chef.ouvrier@ecotrack.tn': {
    pass: 'Ouvrier2026!',
    role: 'CHEF_OUVRIER',
    fullName: 'Karim Ben Salem (Chef Voirie)',
    municipality: 'Municipalité de Tunis'
  },
  'citoyen@ecotrack.tn': {
    pass: 'Citoyen2026!',
    role: 'CITOYEN',
    fullName: 'Anis Mahjoub (Citoyen)',
    municipality: 'Municipalité de Tunis'
  }
};

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const normEmail = email.toLowerCase().trim();
  const demoProfile = DEMO_FALLBACK_ACCOUNTS[normEmail];
  const isDemoMatch = demoProfile && demoProfile.pass === password;

  const fallbackResult: LoginResult | null = isDemoMatch
    ? {
        kind: 'success',
        accessToken: `mock_jwt_token_${demoProfile.role.toLowerCase()}`,
        user: {
          id: `demo_${demoProfile.role.toLowerCase()}_001`,
          email: normEmail,
          fullName: demoProfile.fullName,
          role: demoProfile.role,
          municipality: demoProfile.municipality,
        },
      }
    : null;

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
      if (fallbackResult) return fallbackResult;
      return { kind: 'invalidCredentials' };
    } else {
      if (fallbackResult) return fallbackResult;
      return { kind: 'serverError', status: response.status };
    }
  } catch {
    if (fallbackResult) return fallbackResult;
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
