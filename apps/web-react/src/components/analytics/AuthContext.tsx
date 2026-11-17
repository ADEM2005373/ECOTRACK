import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthSession } from './authApi';

/** Why the user is back on the login form: shown as a message there. */
export type SignOutReason = 'expired' | 'invalid' | null;

interface AuthContextValue {
  session: AuthSession | null;
  signOutReason: SignOutReason;
  signIn(session: AuthSession): void;
  signOut(reason?: SignOutReason): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Minimal admin session, in memory only (never localStorage, URL or logs).
 * No refresh token flow: when the 15-minute access token expires, the user is
 * sent back to the login form with a message.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [signOutReason, setSignOutReason] = useState<SignOutReason>(null);

  const signIn = useCallback((next: AuthSession) => {
    setSignOutReason(null);
    setSession(next);
  }, []);

  const signOut = useCallback((reason: SignOutReason = null) => {
    setSession(null);
    setSignOutReason(reason);
  }, []);

  useEffect(() => {
    if (session === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => signOut('expired'), Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session, signOut]);

  const value = useMemo(
    () => ({ session, signOutReason, signIn, signOut }),
    [session, signOutReason, signIn, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
