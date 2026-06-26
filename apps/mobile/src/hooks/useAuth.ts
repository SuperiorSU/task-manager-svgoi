import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';
import { getErrorMessage } from '../utils/errorHandler';

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
