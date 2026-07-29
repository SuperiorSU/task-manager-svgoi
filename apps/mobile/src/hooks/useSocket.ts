import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../stores/auth.store';
import { connectSocket, disconnectSocket } from '../services/socket.service';
import { queryKeys } from '../constants/queryKeys';

export const useSocket = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken || !user) return;

    // The server joins us to `user:{id}` itself, from the verified handshake
    // token — no client-side room join (that was an IDOR). Re-running on
    // accessToken change also re-handshakes with the refreshed token.
    const socket = connectSocket(accessToken);

    // The server writes the Notification row and emits this in the same request,
    // so the DB is always the source of truth — treat the event purely as a
    // "refetch" trigger rather than optimistically inserting anything locally
    // (that's what prevents ghost/duplicate rows).
    socket.on('notification:new', (payload: { taskId?: string } | undefined) => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });

      // Task-affecting events must also refresh the task views. Without this a
      // task reassigned away from you lingers on your list/detail screen until
      // a manual pull-to-refresh — the server correctly rejects any action you
      // take on it, but the stale UI is confusing. Reassignment notifies both
      // the old and new assignee, so both screens self-correct.
      if (payload?.taskId) {
        void qc.invalidateQueries({ queryKey: queryKeys.tasks.all() });
        void qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(payload.taskId) });
        void qc.invalidateQueries({ queryKey: queryKeys.tasks.activity(payload.taskId) });
        void qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats('week') });
      }
    });

    socket.on('notification:count', ({ unread }: { unread: number }) => {
      void qc.setQueryData(queryKeys.notifications.unreadCount(), { data: { count: unread } });
    });

    return () => {
      disconnectSocket();
    };
  }, [accessToken, user, qc]);
};
