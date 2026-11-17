/**
 * État de session d'authentification (Zustand).
 * Ne contient jamais le mot de passe. L'inscription ne renvoie pas de jeton :
 * la persistance sécurisée (expo-secure-store) viendra avec le ticket Login.
 */
import { create } from 'zustand';
import { registerUser, type RegisterResult } from '../services/authApi';
import type { RegisterPayload } from '../screens/Auth/registerSchema';

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export type AuthError = Exclude<RegisterResult, { kind: 'success' }>;

export type AuthUser = {
  id: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: string | null;
};

type AuthState = {
  status: AuthStatus;
  error: AuthError | null;
  user: AuthUser | null;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  reset: () => void;
};

const initialState = { status: 'idle', error: null, user: null } as const;

// Requête d'inscription en cours : un double appui renvoie la même promesse.
let pendingRegister: Promise<RegisterResult> | null = null;

export const useAuthStore = create<AuthState>()((set) => ({
  ...initialState,

  register: (payload) => {
    if (pendingRegister) return pendingRegister;
    set({ status: 'loading', error: null });

    pendingRegister = registerUser(payload)
      .then((result) => {
        if (result.kind === 'success') {
          // Données renvoyées par l'API, sinon celles saisies (hors mot de passe).
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

  reset: () => set(initialState),
}));
