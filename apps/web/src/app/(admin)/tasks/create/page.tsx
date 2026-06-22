'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useCreateTask } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { createTaskSchema } from '@godigitify/types';
import type { CreateTaskDto } from '@godigitify/types';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const { mutate: createTask, isPending } = useCreateTask();
  const { data: usersData } = useUsers();
  const users = (usersData as { items?: Array<{ id: string; name: string }> })?.items ?? [];

  const { register, handleSubmit, control, formState: { errors } } = useForm<CreateTaskDto>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const onSubmit = (data: CreateTaskDto) => {
    createTask(data, {
      onSuccess: () => {
        toast.success('Task created');
        router.push('/tasks');
      },
      onError: () => toast.error('Failed to create task'),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create Task</h1>
        <p className="text-sm text-slate-500">Fill in the task details below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Task Title"
                placeholder="Enter a clear, specific task title"
                error={errors.title?.message}
                {...register('title')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <textarea
                placeholder="Describe what needs to be done..."
                className="w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={4}
                {...register('description')}
              />
            </div>

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

            {users.length > 0 && (
              <Controller
                control={control}
                name="assigneeId"
                render={({ field }) => (
                  <Select
                    label="Assignee"
                    options={users.map((u) => ({ value: u.id, label: u.name }))}
                    placeholder="Select assignee..."
                    {...field}
                    value={field.value ?? ''}
                  />
                )}
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="muted" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create Task
          </Button>
        </div>
      </form>
    </div>
  );
}
