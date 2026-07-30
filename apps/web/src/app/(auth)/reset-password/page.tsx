'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Link2 } from 'lucide-react';

import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

/**
 * Public password-reset page, reached via the reset email link
 * (FRONTEND_URL/reset-password?token=…). Reset tokens are valid 15 minutes.
 */
function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const reset = useMutation({
    mutationFn: () => api.post('/auth/reset-password', { token, password }),
    onSuccess: () => router.replace('/login?reset=1'),
  });

  const resetError = (reset.error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setError('');
    reset.mutate();
  };

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <Link2 className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="mb-1 text-xl font-bold text-slate-900">This link isn&apos;t valid</h1>
        <p className="mb-6 text-sm text-slate-500">
          Your reset link is invalid or has expired. Request a new one from the sign-in page.
        </p>
        <Button variant="secondary" className="w-full" onClick={() => router.replace('/login')}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
          <KeyRound className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Reset your password</p>
          <p className="text-xs text-slate-500">Choose a new password</p>
        </div>
      </div>

      <h1 className="mb-1 text-xl font-bold text-slate-900">Set a new password</h1>
      <p className="mb-8 text-sm text-slate-500">This link expires 15 minutes after it was sent.</p>

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

        {resetError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {resetError}
          </div>
        )}

        <Button type="submit" className="w-full" loading={reset.isPending}>
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm animate-pulse space-y-4"><div className="h-8 w-48 rounded bg-slate-200" /><div className="h-40 rounded bg-slate-100" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
