import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastStore = {
  toasts: ToastItem[];
  show: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
};

export const TOAST_AUTO_DISMISS_MS = 2500;
const AUTO_DISMISS_MS = TOAST_AUTO_DISMISS_MS;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  show: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
