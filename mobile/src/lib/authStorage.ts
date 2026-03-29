import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

let inMemorySession: AuthSession | null = null;

function isWebStorageAvailable() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

async function getStoredValue(key: string) {
  if (isWebStorageAvailable()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (isWebStorageAvailable()) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      return;
    }
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string) {
  if (isWebStorageAvailable()) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch {
      return;
    }
  }

  await SecureStore.deleteItemAsync(key);
}

export const getAccessToken = () => inMemorySession?.accessToken ?? null;

export const getRefreshToken = () => inMemorySession?.refreshToken ?? null;

export const getSession = () => inMemorySession;

export async function loadSession(): Promise<AuthSession | null> {
  const [accessToken, refreshToken] = await Promise.all([
    getStoredValue(ACCESS_TOKEN_KEY),
    getStoredValue(REFRESH_TOKEN_KEY),
  ]);

  if (!accessToken || !refreshToken) {
    inMemorySession = null;
    return null;
  }

  inMemorySession = {
    accessToken,
    refreshToken,
  };

  return inMemorySession;
}

export async function saveSession(session: AuthSession): Promise<void> {
  inMemorySession = session;

  await Promise.all([
    setStoredValue(ACCESS_TOKEN_KEY, session.accessToken),
    setStoredValue(REFRESH_TOKEN_KEY, session.refreshToken),
  ]);
}

export async function updateSessionTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
}) {
  const currentSession = inMemorySession ?? (await loadSession());

  if (!currentSession) {
    return null;
  }

  const nextSession: AuthSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? currentSession.refreshToken,
  };

  await saveSession(nextSession);
  return nextSession;
}

export async function clearSession(): Promise<void> {
  inMemorySession = null;

  await Promise.all([
    deleteStoredValue(ACCESS_TOKEN_KEY),
    deleteStoredValue(REFRESH_TOKEN_KEY),
  ]);
}
