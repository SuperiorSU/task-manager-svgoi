'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import dayjs from 'dayjs';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const editTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().min(1, 'Due date is required'),
  assigneeId: z.string().min(1, 'Assignee is required'),
  departmentId: z.string().optional(),
});
type EditTaskForm = z.infer<typeof editTaskSchema>;

export default function EditTaskPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: task, isLoading } = useTask(id);
  const { data: usersData } = useUsers({ limit: 100 });
  const { data: departments } = useDepartments();

  const users = usersData?.items ?? [];

  const deptOptions = [
    { value: '', label: 'No specific department' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  const t = task as typeof task & {
    departmentId?: string;
    assigneeId?: string;
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditTaskForm>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: t?.title ?? '',
      description: t?.description ?? '',
      priority: (t?.priority as EditTaskForm['priority']) ?? 'MEDIUM',
      dueDate: t?.dueDate ? dayjs(t.dueDate).format('YYYY-MM-DDTHH:mm') : '',
      assigneeId: t?.assigneeId ?? t?.assignee?.id ?? '',
      departmentId: t?.departmentId ?? '',
    },
  });

  const onSubmit = (_data: EditTaskForm) => {
    toast.success('Task updated');
    router.push(`/tasks/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Task not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Edit Task</h1>
          <p className="text-xs text-slate-500 truncate max-w-xs">{task.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Task Details</h2>
          <Input
            label="Title"
            error={errors.title?.message}
            {...register('title')}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg border border-surface-border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              {...register('description')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select
                  label="Priority"
                  options={PRIORITY_OPTIONS}
                  error={errors.priority?.message}
                  {...field}
                />
              )}
            />
            <Input
              label="Due Date"
              type="datetime-local"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5">
          <h2 className="text-sm font-semibold text-slate-700">Assignment</h2>
          {userOptions.length > 0 && (
            <Controller
              control={control}
              name="assigneeId"
              render={({ field }) => (
                <Select
                  label="Assignee"
                  options={userOptions}
                  error={errors.assigneeId?.message}
                  {...field}
                />
              )}
            />
          )}
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
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
