'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuth';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const { mutate: login, isPending, error } = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const errorMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

  return (
    <div className="w-full max-w-sm">
      {/* Logo — left-aligned, authoritative */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
          S
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">SVGOI</p>
          <p className="text-xs text-slate-500">Sri Vishwakarma Group of Institutions</p>
        </div>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-slate-900">Sign in to your account</h1>
      <p className="mb-8 text-sm text-slate-500">Enter your employee credentials to continue.</p>

      <form onSubmit={handleSubmit((d) => login(d))} className="space-y-5" noValidate>
        <Input
          label="Employee ID"
          placeholder="e.g. CS001"
          autoComplete="username"
          error={errors.employeeId?.message}
          {...register('employeeId')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <Button type="submit" className="w-full" loading={isPending}>
          Sign In
        </Button>
      </form>
    </div>
  );
}
