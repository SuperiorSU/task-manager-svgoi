import { useQuery, useQueryClient } from '@tanstack/react-query';

import { orgConfigService } from '../services/orgConfig.service';
import type { OrgConfig } from '../data/orgConfig.mock';
import { useApiMutation } from './useApiMutation';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const QK = {
  orgConfig: ['sa', 'org-config'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useOrgConfig = () =>
  useQuery({
    queryKey: QK.orgConfig,
    queryFn: orgConfigService.getOrgConfig,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateOrgConfig = () => {
  const qc = useQueryClient();
  return useApiMutation({
    mutationFn: (patch: Partial<OrgConfig>) => orgConfigService.updateOrgConfig(patch),
    successMessage: 'Settings saved',
    onSuccess: (updated) => qc.setQueryData(QK.orgConfig, updated),
  });
};
