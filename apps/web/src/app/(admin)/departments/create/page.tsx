'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateDepartment } from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';

const schema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z
    .string()
    .min(2, 'Code is required')
    .max(8, 'Code must be ≤ 8 characters')
    .toUpperCase(),
  description: z.string().optional(),
  headId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CreateDepartmentPage() {
  const router = useRouter();
  const { mutate: createDept, isPending } = useCreateDepartment();
  const { data: usersData } = useUsers({ role: 'ADMIN', limit: 100 });

  const adminOptions = [
    { value: '', label: 'No HOD assigned' },
    ...(usersData?.items ?? []).map((u) => ({
      value: u.id,
      label: u.name,
    })),
  ];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    const payload: { name: string; code: string; description?: string; headId?: string } = {
      name: data.name,
      code: data.code,
    };
    if (data.description) payload.description = data.description;
    if (data.headId) payload.headId = data.headId;
    createDept(
      payload,
      {
        onSuccess: () => {
          toast.success('Department created');
          router.push('/departments');
        },
        onError: () => toast.error('Failed to create department'),
      }
    );
  };

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
          <h1 className="text-xl font-bold text-slate-900">New Department</h1>
          <p className="text-xs text-slate-500">Add a new department to the organisation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Department Name"
                placeholder="e.g. Computer Science"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <Input
              label="Short Code"
              placeholder="e.g. CS"
              error={errors.code?.message}
              {...register('code')}
              style={{ textTransform: 'uppercase' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the department…"
              className="w-full rounded-lg border border-surface-border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('description')}
            />
          </div>
          <Controller
            control={control}
            name="headId"
            render={({ field }) => (
              <Select
                label="Head of Department (optional)"
                options={adminOptions}
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
            Create Department
          </Button>
        </div>
      </form>
    </div>
  );
}
