'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useVerifyOtp, useResendOtp } from '@/hooks/useAuth';

type Props = {
  challengeId: string;
  onBack: () => void;
};

/**
 * Second step of the web login — the emailed 6-digit code. Reached only after
 * a correct password (the API issues no session until this succeeds).
 */
export function LoginOtpStep({ challengeId, onBack }: Props) {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [resent, setResent] = useState(false);

  const verify = useVerifyOtp();
  const resend = useResendOtp();

  const verifyError = (verify.error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verify.mutate({ challengeId, code, trustDevice });
  };

  const handleResend = () => {
    setResent(false);
    resend.mutate(challengeId, { onSuccess: () => setResent(true) });
  };

  return (
    <div className="w-full max-w-sm">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50">
        <ShieldCheck className="h-6 w-6 text-brand-600" />
      </div>

      <h1 className="mb-1 text-2xl font-bold text-slate-900">Enter your code</h1>
      <p className="mb-8 text-sm text-slate-500">
        We emailed you a 6-digit verification code. It expires in 5 minutes.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="••••••"
          aria-label="Verification code"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Trust this device for 30 days
        </label>

        {verifyError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {verifyError}
          </div>
        )}

        <Button type="submit" className="w-full" loading={verify.isPending} disabled={code.length !== 6}>
          Verify &amp; sign in
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        {resent ? (
          <span className="text-emerald-600">A new code has been sent.</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resend.isPending}
            className="font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            Didn&apos;t get it? Resend code
          </button>
        )}
      </div>
    </div>
  );
}
