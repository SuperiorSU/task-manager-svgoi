'use client';

import { useQueryClient } from '@tanstack/react-query';
import { avatarService } from '@/services/avatar.service';
import { useAuthStore } from '@/stores/auth.store';
import { queryKeys } from '@/constants/queryKeys';
import { useApiMutation } from './useApiMutation';

/** Change the signed-in user's own profile photo (self-only on the server). */
export const useChangeAvatar = () => {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useApiMutation({
    mutationFn: (file: File) => avatarService.change(file),
    successMessage: 'Photo updated',
    onSuccess: (updated) => {
      // Refresh the sidebar/topbar avatar immediately, then re-fetch any user
      // lists/detail that render it.
      setUser(updated);
      void qc.invalidateQueries({ queryKey: queryKeys.users.all() });
    },
  });
};
