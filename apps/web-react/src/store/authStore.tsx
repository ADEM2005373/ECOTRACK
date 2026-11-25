import React, { createContext, useContext, useReducer, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MunicipalityTerritory {
  center: [number, number];
  bbox: [number, number, number, number];
  displayName?: string;
  polygon?: [number, number][];
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  municipality?: string;
  territory?: MunicipalityTerritory;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; accessToken: string } }
  | { type: 'LOGOUT' };

// ── Reducer ───────────────────────────────────────────────────────────────────
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return { user: null, accessToken: null, isAuthenticated: false };
    default:
      return state;
  }
}

// ── Initial state (hydrate from localStorage) ─────────────────────────────────
const LS_TOKEN_KEY = 'ecotrack_access_token';
const LS_USER_KEY  = 'ecotrack_user';

function getInitialState(): AuthState {
  try {
    const token = localStorage.getItem(LS_TOKEN_KEY);
    const rawUser = localStorage.getItem(LS_USER_KEY);
    if (token && rawUser) {
      const user: AuthUser = JSON.parse(rawUser);
      return { user, accessToken: token, isAuthenticated: true };
    }
  } catch {
    // ignore corrupted storage
  }
  return { user: null, accessToken: null, isAuthenticated: false };
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AuthContextValue {
  state: AuthState;
  loginSuccess: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);

  // Persist token & user on state change
  useEffect(() => {
    if (state.isAuthenticated && state.accessToken && state.user) {
      localStorage.setItem(LS_TOKEN_KEY, state.accessToken);
      localStorage.setItem(LS_USER_KEY, JSON.stringify(state.user));
    } else {
      localStorage.removeItem(LS_TOKEN_KEY);
      localStorage.removeItem(LS_USER_KEY);
    }
  }, [state]);

  const loginSuccess = (user: AuthUser, accessToken: string) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken } });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ state, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContextValue: AuthContextValue = {
  state: { user: null, accessToken: null, isAuthenticated: false },
  loginSuccess: () => {},
  logout: () => {},
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx || defaultAuthContextValue;
}
