'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Users as UsersIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { RoleChip } from '@/components/shared/RoleChip';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUsers, useDeactivateUser } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS } from '@/constants/permissions';
import { toast } from 'sonner';
import type { User, Role } from '@godigitify/types';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 400);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useUsers({ search: debouncedSearch || undefined });
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateUser();

  const users = ((data as { items?: User[] })?.items ?? []) as User[];

  return (
    <div className="max-w-screen-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">{(data as { total?: number })?.total ?? 0} total users</p>
        </div>
        <PermissionGate permission={PERMISSIONS.USER_CREATE}>
          <Button leftIcon={<Plus className="h-4 w-4" />} asChild>
            <Link href="/users/create">Add User</Link>
          </Button>
        </PermissionGate>
      </div>

      <div className="w-64">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" description="No users match your search." />
      ) : (
        <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-surface-border hover:bg-surface-muted transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarWithFallback name={user.name} src={user.avatarUrl} size={32} />
                      <div>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-slate-900 hover:text-brand-500"
                        >
                          {user.name}
                        </Link>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleChip role={user.role as Role} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(user as User & { department?: { name: string } }).department?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {dayjs(user.createdAt).format('MMM D, YYYY')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.isActive && (
                      <PermissionGate permission={PERMISSIONS.USER_DEACTIVATE}>
                        <button
                          onClick={() => setDeactivateId(user.id)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Deactivate
                        </button>
                      </PermissionGate>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() => {
          if (!deactivateId) return;
          deactivate(deactivateId, {
            onSuccess: () => { toast.success('User deactivated'); setDeactivateId(null); },
            onError: () => toast.error('Failed to deactivate user'),
          });
        }}
        title="Deactivate User"
        message="This will revoke all active sessions and block the user from logging in."
        confirmLabel="Deactivate"
        loading={isDeactivating}
      />
    </div>
  );
}
