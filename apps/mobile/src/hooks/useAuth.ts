import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi, usersApi } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';
import { useNotificationStore } from '../stores/notification.store';
import { useAppStore } from '../stores/app.store';
import { getErrorMessage } from '../utils/errorHandler';
import { registerForPushNotifications } from '../services/notification.service';

const REFRESH_TOKEN_KEY = 'refresh_token';

export const useLogin = () => {
  const { login } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, password }: { employeeId: string; password: string }) =>
      authApi.login(employeeId, password),
    onSuccess: async (res) => {
      const { tokens, user } = res.data;
      await login(tokens.accessToken, tokens.refreshToken, user);
      qc.clear();

      // Best-effort: a denied permission or missing device token must never block login.
      try {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await usersApi.registerPushToken(pushToken, Platform.OS === 'ios' ? 'ios' : 'android');
        }
      } catch {
        // Silently ignore — push is a convenience feature, not auth-critical.
      }
    },
    onError: (err) => getErrorMessage(err),
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Send refresh token so the server can revoke it (security directive §1.4)
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try { await authApi.logout(refreshToken); } catch {}
      }
    },
    onSettled: async () => {
      await logout();
      qc.clear();
      // These two stores are never touched by auth.store.logout() — left
      // uncleared, a stale unread badge or a previous user's queued offline
      // mutations could carry over into the next session on the same device.
      useNotificationStore.getState().clearUnread();
      useAppStore.getState().clearOfflineQueue();
    },
  });
};

export const useForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => setSubmitted(true),
    onError: () => setSubmitted(true), // Always show success to prevent email enumeration
  });

  return { ...mutation, submitted };
};
