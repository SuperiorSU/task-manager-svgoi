import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@godigitify/api-client';

import { useAuthStore } from '../stores/auth.store';
import { getErrorMessage } from '../utils/errorHandler';

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
  const { accessToken, logout } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (accessToken) {
        // Best-effort logout call — don't block on failure
        try {
          await authApi.logout();
        } catch {}
      }
    },
    onSettled: async () => {
      await logout();
      qc.clear();
    },
  });
};
