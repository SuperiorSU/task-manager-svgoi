'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@godigitify/types';

export const useLogin = () => {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { employeeId: string; password: string }) =>
      api.post<{ data: { user: User } }>('/auth/login', data),
    onSuccess: (res) => {
      setUser(res.data.data.user);
      qc.clear();
      router.push('/dashboard');
    },
  });
};

export const useLogout = () => {
  const { setUser } = useAuthStore();
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      setUser(null);
      qc.clear();
      router.push('/login');
    },
  });
};
