'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';
import { useState, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const TaskFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 400);

  const setParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    value ? params.set(key, value) : params.delete(key);
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setParam('q', debouncedSearch || undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const hasActiveFilters = ['q', 'status', 'priority'].some((k) => searchParams.has(k));

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>
      <div className="w-44">
        <Select
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          value={searchParams.get('status') ?? ''}
          onChange={(e) => setParam('status', e.target.value || undefined)}
        />
      </div>
      <div className="w-40">
        <Select
          options={PRIORITY_OPTIONS}
          placeholder="All priorities"
          value={searchParams.get('priority') ?? ''}
          onChange={(e) => setParam('priority', e.target.value || undefined)}
        />
      </div>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<X className="h-4 w-4" />}
          onClick={() => {
            setSearch('');
            router.replace(pathname);
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
};
