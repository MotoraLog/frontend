import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import {
  getAccessToken,
  getRefreshToken,
  updateSessionTokens,
} from './authStorage';
import type { ApiErrorResponse } from './types';

const FALLBACK_API_URL = 'http://localhost:3000/api';

let onUnauthorized: (() => void | Promise<void>) | null = null;

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function normalizeBaseUrl(value?: string) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return FALLBACK_API_URL;
  }

  return rawValue.endsWith('/api') ? rawValue : `${rawValue}/api`;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error('Token de atualização não disponível.');
  }

  const response = await axios.post(
    `${normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL)}/auth/refresh`,
    { refreshToken },
    { timeout: 15000 }
  );

  const tokens = response.data?.data?.tokens;

  if (!tokens?.accessToken) {
    throw new Error('A resposta de atualização não retornou um token de acesso.');
  }

  await updateSessionTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  return tokens.accessToken as string;
}

export function registerUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  onUnauthorized = handler;
}

export const api = axios.create({
  baseURL: normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (onUnauthorized) {
          await onUnauthorized();
        }

        throw refreshError;
      }
    }

    throw error;
  }
);

export const getApiErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      'Erro inesperado ao comunicar com a API.'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado.';
};
