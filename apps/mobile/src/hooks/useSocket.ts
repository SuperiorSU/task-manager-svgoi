import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../stores/auth.store';
import { connectSocket, disconnectSocket, joinUserRoom } from '../services/socket.service';
import { queryKeys } from '../constants/queryKeys';

export const useSocket = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  useEffect(() => {
    if (!accessToken || !user) return;

    const socket = connectSocket(accessToken);
    joinUserRoom(user.id);

    socket.on('notification:new', () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    });

    socket.on('notification:count', ({ unread }: { unread: number }) => {
      void qc.setQueryData(queryKeys.notifications.unreadCount(), { data: { count: unread } });
    });

    return () => {
      disconnectSocket();
    };
  }, [accessToken, user, qc]);
};
