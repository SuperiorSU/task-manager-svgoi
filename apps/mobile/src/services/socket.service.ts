import { io, type Socket } from 'socket.io-client';

import { getApiBaseUrl } from './api.service';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(getApiBaseUrl(), {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] connect error:', err.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;

export const joinTaskRoom = (taskId: string): void => {
  socket?.emit('join:task', taskId);
};

export const leaveTaskRoom = (taskId: string): void => {
  socket?.emit('leave:task', taskId);
};

// NOTE: there is intentionally no `joinUserRoom`. The server derives the
// personal room from the verified JWT in the handshake (socket.plugin.ts) —
// letting the client name its own room was an IDOR: anyone could subscribe to
// another user's private notification stream.
