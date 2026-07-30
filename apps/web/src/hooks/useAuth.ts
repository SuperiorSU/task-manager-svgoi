'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User, AuthTokens, MfaChallenge } from '@godigitify/types';

type LoginSession = { tokens: AuthTokens; user: User };
type LoginResult = LoginSession | MfaChallenge;

export const useLogin = () => {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { employeeId: string; password: string }) =>
      api.post<{ data: LoginResult }>('/auth/login', data),
    onSuccess: (res) => {
      const result = res.data.data;
      // 2FA required: the page swaps to the code step (it reads mfaRequired via
      // a per-call onSuccess). No session yet, so don't set the user or redirect.
      if ('mfaRequired' in result) return;
      setUser(result.user);
      qc.clear();
      router.push('/dashboard');
    },
  });
};

export const useVerifyOtp = () => {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (vars: { challengeId: string; code: string; trustDevice: boolean }) =>
      api.post<{ data: LoginSession }>('/auth/login/verify', vars),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      qc.clear();
      router.push('/dashboard');
    },
  });
};

export const useResendOtp = () =>
  useMutation({
    mutationFn: (challengeId: string) => api.post('/auth/login/resend', { challengeId }),
  });

export const useLogout = () => {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      setUser(null);
      qc.clear();
      // Hard redirect, NOT router.push: a full reload guarantees the cleared
      // cookies take effect and no stale client/RSC state survives. A soft nav
      // left the app half-logged-out — sidebar options gone (client user
      // cleared) but the server session still lingering after a middleware
      // bounce. `replace` also keeps the logged-out app out of history.
      if (typeof window !== 'undefined') window.location.replace('/login');
    },
  });
};
