import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { getApiErrorMessage, registerUnauthorizedHandler } from '../lib/api';
import {
  clearSession,
  loadSession,
  saveSession,
  type AuthSession,
} from '../lib/authStorage';
import { getCurrentUser, login } from '../lib/services';
import type { User } from '../lib/types';

type AuthContextValue = {
  session: AuthSession | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(signOut);

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [signOut]);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const currentSession = await loadSession();

        if (!currentSession) {
          setSession(null);
          setUser(null);
          return;
        }

        setSession(currentSession);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch {
        await signOut();
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapSession();
  }, [signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await login(email, password);

      const nextSession: AuthSession = {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      };

      await saveSession(nextSession);
      setSession(nextSession);
      setUser(result.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error));
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
      signIn,
      signOut,
    }),
    [isLoading, session, signIn, signOut, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
