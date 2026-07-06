'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateUser } from '@/hooks/useUsers';
import { createUserSchema } from '@godigitify/types';
import type { CreateUserDto } from '@godigitify/types';

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ADMIN', label: 'Admin' },
];

export default function CreateUserPage() {
  const router = useRouter();
  const { mutate: createUser, isPending } = useCreateUser();

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'EMPLOYEE' },
  });

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add User</h1>
        <p className="text-sm text-slate-500">
          A temporary password will be generated and sent to the user&apos;s email.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((data) =>
          // Success/error toasts already shown by useCreateUser (useApiMutation).
          createUser(data, { onSuccess: () => router.push('/users') })
        )}
        className="space-y-6"
      >
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul@svgoi.edu.in"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Employee ID"
            placeholder="e.g. CS001"
            error={errors.employeeId?.message}
            {...register('employeeId')}
          />
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select
                label="Role"
                options={ROLE_OPTIONS}
                error={errors.role?.message}
                {...field}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="muted" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={isPending}>Create User</Button>
        </div>
      </form>
    </div>
  );
}
