import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import { initApiClient } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';

const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env['EXPO_PUBLIC_API_URL'] ??
  'http://localhost:3001';

const REFRESH_TOKEN_KEY = 'refresh_token';

export const initApi = () => {
  initApiClient({
    baseUrl: BASE_URL,
    getToken: async () => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) return accessToken;

      // Try silent refresh
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      try {
        const { authApi } = await import('@godigitify/api-client');
        const result = await authApi.refresh(refreshToken);
        useAuthStore.getState().setAccessToken(result.data.accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.data.refreshToken);
        return result.data.accessToken;
      } catch {
        await useAuthStore.getState().logout();
        return null;
      }
    },
    onUnauthorized: () => {
      void useAuthStore.getState().logout();
    },
  });
};
