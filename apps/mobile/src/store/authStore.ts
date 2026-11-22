/**
 * État de session d'authentification (Zustand).
 * Persistance sécurisée via expo-secure-store.
 */
import { create } from 'zustand';
import { registerUser, loginUser, type RegisterResult, type LoginResult, type LoggedInUser } from '../services/authApi';
import type { RegisterPayload } from '../screens/Auth/registerSchema';
import type { LoginPayload } from '../services/authApi';

// Lazy-import expo-secure-store to gracefully handle environments where it's unavailable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let SecureStore: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SecureStore = require('expo-secure-store');
} catch {
  // Running in a web/test environment without native module support.
}

const STORAGE_KEY_TOKEN = 'ecotrack_access_token';
const STORAGE_KEY_USER = 'ecotrack_user';

async function persistToken(token: string): Promise<void> {
  try {
    await SecureStore?.setItemAsync(STORAGE_KEY_TOKEN, token);
  } catch {
    // Ignore storage failures.
  }
}

async function persistUser(user: LoggedInUser): Promise<void> {
  try {
    await SecureStore?.setItemAsync(STORAGE_KEY_USER, JSON.stringify(user));
  } catch {
    // Ignore storage failures.
  }
}

async function clearStorage(): Promise<void> {
  try {
    await SecureStore?.deleteItemAsync(STORAGE_KEY_TOKEN);
    await SecureStore?.deleteItemAsync(STORAGE_KEY_USER);
  } catch {
    // Ignore storage failures.
  }
}

async function loadToken(): Promise<string | null> {
  try {
    return (await SecureStore?.getItemAsync(STORAGE_KEY_TOKEN)) ?? null;
  } catch {
    return null;
  }
}

async function loadUser(): Promise<LoggedInUser | null> {
  try {
    const raw = await SecureStore?.getItemAsync(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw) as LoggedInUser;
  } catch {
    return null;
  }
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export type AuthError = Exclude<RegisterResult, { kind: 'success' }>;

export type AuthUser = {
  id: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string | null;
  municipality?: string | null;
};

type AuthState = {
  status: AuthStatus;
  error: AuthError | null;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  status: 'idle' as AuthStatus,
  error: null,
  user: null,
  accessToken: null,
  isAuthenticated: false,
};

// Deduplication guards.
let pendingRegister: Promise<RegisterResult> | null = null;
let pendingLogin: Promise<LoginResult> | null = null;

export const useAuthStore = create<AuthState>()((set) => ({
  ...initialState,

  register: (payload) => {
    if (pendingRegister) return pendingRegister;
    set({ status: 'loading', error: null });

    pendingRegister = registerUser(payload)
      .then((result) => {
        if (result.kind === 'success') {
          const apiUser = result.user;
          set({
            status: 'success',
            user: {
              id: apiUser?.id ?? null,
              fullName: apiUser?.fullName ?? payload.fullName,
              email: apiUser?.email ?? payload.email,
              phoneNumber: apiUser?.phoneNumber ?? payload.phoneNumber,
              role: apiUser?.role ?? null,
            },
          });
        } else {
          set({ status: 'error', error: result });
        }
        return result;
      })
      .finally(() => {
        pendingRegister = null;
      });

    return pendingRegister;
  },

  login: (payload) => {
    if (pendingLogin) return pendingLogin;
    set({ status: 'loading', error: null });

    pendingLogin = loginUser(payload)
      .then(async (result) => {
        if (result.kind === 'success') {
          const { accessToken, user } = result;
          const authUser: AuthUser = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: null,
            role: user.role,
            municipality: user.municipality ?? 'Mairie de Zarzouna',
          };
          set({
            status: 'success',
            user: authUser,
            accessToken,
            isAuthenticated: true,
          });
          await persistToken(accessToken);
          await persistUser(user);
        } else {
          set({ status: 'error' });
        }
        return result;
      })
      .finally(() => {
        pendingLogin = null;
      });

    return pendingLogin;
  },

  logout: async () => {
    await clearStorage();
    set({ ...initialState, status: 'idle' });
  },

  loadSession: async () => {
    const [token, user] = await Promise.all([loadToken(), loadUser()]);
    if (token && user) {
      set({
        accessToken: token,
        isAuthenticated: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: null,
          role: user.role,
          municipality: (user as any).municipality ?? 'Mairie de Zarzouna',
        },
        status: 'success',
      });
    }
  },

  reset: () => set(initialState),
}));

/** Sélecteur pratique : vrai si un token de session est présent. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}
