import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import { initApiClient } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';

const REFRESH_TOKEN_KEY = 'refresh_token';

export function getApiBaseUrl(): string {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:3001`;
    }
  }
  return (
    (Constants.expoConfig?.extra as Record<string, unknown>)?.apiUrl as string |
    undefined ??
    process.env['EXPO_PUBLIC_API_URL'] ??
    'http://localhost:3001'
  );
}

// Uses raw fetch — NOT the API client — to avoid calling getToken() recursively.
async function silentRefresh(baseUrl: string, refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await useAuthStore.getState().logout();
      return null;
    }
    const json = await res.json() as {
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    };
    if (!json.success) {
      await useAuthStore.getState().logout();
      return null;
    }
    useAuthStore.getState().setAccessToken(json.data.accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, json.data.refreshToken);
    return json.data.accessToken;
  } catch {
    await useAuthStore.getState().logout();
    return null;
  }
}

// Shared promise — concurrent callers that all need a refresh wait on the same request
// instead of each firing their own (and stomping each other's rotation).
let _refreshPromise: Promise<string | null> | null = null;

export const initApi = () => {
  const baseUrl = getApiBaseUrl();

  initApiClient({
    baseUrl,
    getToken: async () => {
      // Check in-memory token FIRST — a valid token always wins, even if a background
      // refresh is still in flight from a previous navigation or stale session attempt.
      const { accessToken } = useAuthStore.getState();
      if (accessToken) return accessToken;

      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      // Deduplicate: reuse the in-flight promise instead of starting a second refresh.
      if (!_refreshPromise) {
        _refreshPromise = silentRefresh(baseUrl, refreshToken).finally(() => {
          _refreshPromise = null;
        });
      }

      return _refreshPromise;
    },
    onUnauthorized: () => {
      void useAuthStore.getState().logout();
    },
  });
};
