'use client';

import React, { useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Camera } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { useChangeAvatar } from '@/hooks/useAvatar';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuthStore } from '@/stores/auth.store';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  departmentId: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']),
});
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user, isLoading } = useUser(id);
  const { data: departments } = useDepartments();
  const { mutate: updateUser, isPending } = useUpdateUser();

  // The avatar endpoint only changes the caller's OWN photo, so the control is
  // shown just for the signed-in user editing themselves.
  const authUser = useAuthStore((s) => s.user);
  const isSelf = id === authUser?.id;
  const { mutate: changeAvatar, isPending: isAvatarUploading } = useChangeAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (file) changeAvatar(file);
  };

  const u = user as typeof user & {
    phone?: string;
    designation?: string;
    departmentId?: string;
    employeeId?: string;
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: u?.name ?? '',
      email: u?.email ?? '',
      employeeId: u?.employeeId ?? '',
      phone: u?.phone ?? '',
      designation: u?.designation ?? '',
      departmentId: u?.departmentId ?? '',
      role: (u?.role as 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE') ?? 'EMPLOYEE',
    },
  });

  const deptOptions = [
    { value: '', label: 'No department' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        User not found.
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit {user.name}</h1>
          <p className="text-xs text-slate-500">Update profile information and role</p>
        </div>
      </div>

      {isSelf && (
        <div className="flex items-center gap-4 rounded-lg border border-surface-border bg-white p-6 shadow-card">
          <div className="relative">
            <AvatarWithFallback name={authUser?.name ?? user.name} src={authUser?.avatarUrl} size={64} />
            {isAvatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Profile photo</h2>
            <p className="mb-2 text-xs text-slate-500">JPG or PNG. Cropped to a square and resized automatically.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Camera className="h-3.5 w-3.5" />}
              disabled={isAvatarUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isAvatarUploading ? 'Uploading…' : 'Change photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={onPickAvatar}
            />
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) =>
          // Success/error toasts already shown by useUpdateUser (useApiMutation).
          updateUser({ id, dto: data }, { onSuccess: () => router.push(`/users/${id}`) })
        )}
        className="space-y-5"
      >
        <div className="rounded-lg border border-surface-border bg-white p-6 shadow-card space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Employee ID"
              error={errors.employeeId?.message}
              {...register('employeeId')}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone (optional)"
              type="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Designation (optional)"
              placeholder="e.g. Assistant Professor"
              error={errors.designation?.message}
              {...register('designation')}
            />
          </div>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-6 shadow-card space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Role & Department</h2>
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
          <Controller
            control={control}
            name="departmentId"
            render={({ field }) => (
              <Select
                label="Department (optional)"
                options={deptOptions}
                {...field}
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="muted" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
