'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserCheck, Link2 } from 'lucide-react';
import type { InviteInfo } from '@godigitify/types';

import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * Public account-setup page, reached via the invite email link
 * (FRONTEND_URL/setup?token=…). The new member verifies the invite and chooses
 * their first password, then signs in. No session required.
 */
function SetupForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: async () => {
      const res = await api.get<{ data: InviteInfo }>('/auth/invite', { params: { token } });
      return res.data.data;
    },
    enabled: !!token,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => api.post('/auth/accept-invite', { token, password }),
    onSuccess: () => router.replace('/login?setup=1'),
  });

  const acceptError = (accept.error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setError('');
    accept.mutate();
  };

  const invalid = !token || invite.isError;

  return (
    <div className="w-full max-w-sm">
      {invite.isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
        </div>
      ) : invalid ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <Link2 className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="mb-1 text-xl font-bold text-slate-900">This link isn&apos;t valid</h1>
          <p className="mb-6 text-sm text-slate-500">
            Your invite link is invalid or has expired. Ask your admin to send a fresh one.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => router.replace('/login')}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
              <UserCheck className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Welcome, {invite.data?.name}</p>
              <p className="text-xs text-slate-500">Finish setting up your account</p>
            </div>
          </div>

          <h1 className="mb-1 text-xl font-bold text-slate-900">Set your password</h1>
          <p className="mb-8 text-sm text-slate-500">
            You&apos;ll sign in with your Employee ID
            {invite.data?.employeeId ? ` (${invite.data.employeeId})` : ''}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={error}
            />

            {acceptError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {acceptError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={accept.isPending}>
              Set password &amp; continue
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-slate-200" /><div className="h-40 rounded bg-slate-100" /></div>}>
      <SetupForm />
    </Suspense>
  );
}
