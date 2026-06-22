'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import dayjs from 'dayjs';
import { cn, isOverdue } from '@/lib/utils';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskPriorityBadge, priorityStripeClass } from './TaskPriorityBadge';
import { BulkActionBar } from './BulkActionBar';
import { AvatarWithFallback } from '@/components/shared/AvatarWithFallback';
import type { Task } from '@godigitify/types';

type TaskRow = Task & {
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  department?: { name: string } | null;
};

const col = createColumnHelper<TaskRow>();

type Props = {
  data: TaskRow[];
  isLoading?: boolean;
  total?: number;
  page?: number;
};

export const TaskTable = ({ data, isLoading, total = 0, page = 1 }: Props) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const selectedIds = Object.entries(rowSelection)
    .filter(([, v]) => v)
    .map(([id]) => id);

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(p));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const columns = [
    col.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    }),
    col.accessor('title', {
      header: 'Title',
      size: 280,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* Priority stripe */}
          <div className={cn('h-8 w-1 shrink-0 rounded-full', priorityStripeClass(row.original.priority))} />
          <Link
            href={`/tasks/${row.original.id}`}
            className="max-w-[240px] truncate font-medium text-slate-900 hover:text-brand-500"
            title={row.original.title}
          >
            {row.original.title}
          </Link>
        </div>
      ),
    }),
    col.accessor('status', {
      header: 'Status',
      size: 130,
      cell: ({ getValue, row }) => (
        <TaskStatusBadge
          status={getValue()}
          isOverdue={isOverdue(row.original.dueDate, row.original.status)}
        />
      ),
    }),
    col.accessor('priority', {
      header: 'Priority',
      size: 110,
      cell: ({ getValue }) => <TaskPriorityBadge priority={getValue()} />,
    }),
    col.accessor('assignee', {
      header: 'Assignee',
      size: 160,
      cell: ({ getValue }) => {
        const a = getValue();
        if (!a) return <span className="text-slate-400">—</span>;
        return (
          <div className="flex items-center gap-2">
            <AvatarWithFallback name={a.name} src={a.avatarUrl} size={24} />
            <span className="truncate text-sm">{a.name}</span>
          </div>
        );
      },
    }),
    col.accessor('dueDate', {
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 hover:text-slate-900"
          onClick={column.getToggleSortingHandler()}
        >
          Due Date <ArrowUpDown className="h-3.5 w-3.5" />
        </button>
      ),
      size: 130,
      cell: ({ getValue, row }) => {
        const overdue = isOverdue(row.original.dueDate, row.original.status);
        return (
          <span className={cn('text-sm', overdue ? 'font-medium text-red-600' : 'text-slate-500')}>
            {dayjs(getValue()).format('MMM D, YYYY')}
          </span>
        );
      },
    }),
    col.display({
      id: 'actions',
      size: 50,
      cell: ({ row }) => (
        <Link
          href={`/tasks/${row.original.id}`}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-surface-subtle"
          aria-label="View task"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4 text-slate-400" />
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection, sorting },
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    manualPagination: true,
    pageCount: Math.ceil(total / 20),
  });

  const PAGES = Math.ceil(total / 20);

  return (
    <>
      <div className="rounded-xl border border-surface-border bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-surface-border bg-surface-muted">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-border">
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-slate-400">
                    No tasks found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-surface-border transition-colors hover:bg-surface-muted cursor-pointer',
                      row.getIsSelected() && 'bg-brand-50'
                    )}
                    onClick={() => router.push(`/tasks/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {PAGES > 1 && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3">
            <span className="text-sm text-slate-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-surface-subtle disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= PAGES}
                onClick={() => setPage(page + 1)}
                className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-surface-subtle disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkActionBar selectedIds={selectedIds} onClear={() => setRowSelection({})} />
    </>
  );
};
