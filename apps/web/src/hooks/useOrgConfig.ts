'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { UpdateOrganizationConfigDto } from '@godigitify/types';
import { orgConfigService } from '@/services/orgConfig.service';

const KEY = ['org-config'] as const;

export const useOrgConfig = () =>
  useQuery({ queryKey: KEY, queryFn: () => orgConfigService.get(), staleTime: 5 * 60 * 1000 });

export const useUpdateOrgConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateOrganizationConfigDto) => orgConfigService.update(dto),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
};
