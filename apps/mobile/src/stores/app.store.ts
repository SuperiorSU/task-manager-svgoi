import { create } from 'zustand';

type QueuedMutation = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  timestamp: number;
};

type AppStore = {
  isOnline: boolean;
  offlineQueue: QueuedMutation[];
  setOnlineStatus: (status: boolean) => void;
  addToOfflineQueue: (mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) => void;
  removeFromOfflineQueue: (id: string) => void;
  clearOfflineQueue: () => void;
};

export const useAppStore = create<AppStore>((set) => ({
  isOnline: true,
  offlineQueue: [],

  setOnlineStatus: (status) => set({ isOnline: status }),

  addToOfflineQueue: (mutation) =>
    set((state) => ({
      offlineQueue: [
        ...state.offlineQueue,
        { ...mutation, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),

  removeFromOfflineQueue: (id) =>
    set((state) => ({ offlineQueue: state.offlineQueue.filter((m) => m.id !== id) })),

  clearOfflineQueue: () => set({ offlineQueue: [] }),
}));
