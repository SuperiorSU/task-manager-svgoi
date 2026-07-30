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
import { BulkBar } from '@/components/shared/BulkBar';
import { useUsers, useDeactivateUser, useBulkUserAction } from '@/hooks/useUsers';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/constants/permissions';
import type { User, Role } from '@godigitify/types';

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 400);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  const { data, isLoading } = useUsers({ search: debouncedSearch || undefined });
  const { mutate: deactivate, isPending: isDeactivating } = useDeactivateUser();
  const bulk = useBulkUserAction();

  const users = ((data as { items?: User[] })?.items ?? []) as User[];

  // You can never manage your own account here — the server rejects it and it's
  // confusing UI. Exclude self from selection + hide self's row actions.
  const currentUserId = useAuthStore((s) => s.user?.id);
  const selectableUsers = users.filter((u) => u.id !== currentUserId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selected.has(u.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectableUsers.map((u) => u.id)));

  // Bulk actions go through a confirm step — no silent mass mutation.
  const [bulkAction, setBulkAction] = useState<'deactivate' | 'reactivate' | null>(null);
  const runBulk = () => {
    if (!bulkAction) return;
    bulk.mutate(
      { ids: [...selected], action: bulkAction },
      { onSuccess: () => { setSelected(new Set()); setBulkAction(null); } }
    );
  };

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
        <div className="rounded-lg border border-surface-border bg-white shadow-card overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all users"
                    className="rounded border-surface-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-16 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                <tr
                  key={user.id}
                  className={`border-b border-surface-border transition-colors ${
                    selected.has(user.id) ? 'bg-brand-50' : 'hover:bg-surface-muted'
                  }`}
                >
                  <td className="px-4 py-3">
                    {!isSelf && (
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggle(user.id)}
                        aria-label={`Select ${user.name}`}
                        className="rounded border-surface-border"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarWithFallback name={user.name} src={user.avatarUrl} size={32} />
                      <div>
                        <Link
                          href={`/users/${user.id}`}
                          className="font-medium text-slate-900 hover:text-brand-500"
                        >
                          {user.name}
                          {isSelf && (
                            <span className="ml-2 rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              You
                            </span>
                          )}
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
                    {user.isActive && !isSelf && (
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PermissionGate permission={PERMISSIONS.USER_DEACTIVATE}>
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => setBulkAction('reactivate')}
          >
            Reactivate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-300 hover:bg-white/10"
            onClick={() => setBulkAction('deactivate')}
          >
            Deactivate
          </Button>
        </BulkBar>
      </PermissionGate>

      <ConfirmDialog
        open={bulkAction !== null}
        onClose={() => setBulkAction(null)}
        onConfirm={runBulk}
        title={bulkAction === 'deactivate' ? `Deactivate ${selected.size} user${selected.size === 1 ? '' : 's'}?` : `Reactivate ${selected.size} user${selected.size === 1 ? '' : 's'}?`}
        message={
          bulkAction === 'deactivate'
            ? 'This revokes their active sessions and blocks sign-in until reactivated.'
            : 'This restores access and lets these users sign in again.'
        }
        confirmLabel={bulkAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
        loading={bulk.isPending}
      />

      <ConfirmDialog
        open={!!deactivateId}
        onClose={() => setDeactivateId(null)}
        onConfirm={() => {
          if (!deactivateId) return;
          // Success/error toasts already shown by useDeactivateUser (useApiMutation).
          deactivate(deactivateId, { onSuccess: () => setDeactivateId(null) });
        }}
        title="Deactivate User"
        message="This will revoke all active sessions and block the user from logging in."
        confirmLabel="Deactivate"
        loading={isDeactivating}
      />
    </div>
  );
}
