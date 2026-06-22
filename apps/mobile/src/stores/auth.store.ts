import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { User } from '@godigitify/types';

const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

type AuthStore = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  updateUser: (partial: Partial<User>) => void;
  hydrateFromStorage: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (accessToken, refreshToken, user) => {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, accessToken, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  setAccessToken: (token) => set({ accessToken: token }),

  updateUser: (partial) =>
    set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),

  hydrateFromStorage: async () => {
    try {
      const [userJson, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);

      if (userJson && refreshToken) {
        const user = JSON.parse(userJson) as User;
        // Access token will be fetched fresh on first API call via interceptor
        set({ user, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return (user.permissions ?? []).includes(permission);
  },
}));
