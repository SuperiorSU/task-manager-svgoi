import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeStore = {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (p: ThemePreference) => void;
  hydrate: () => Promise<void>;
};

const THEME_KEY = '@taskflow/theme_preference';

export const useThemeStore = create<ThemeStore>((set) => ({
  preference: 'system',
  hydrated: false,

  setPreference: (preference) => {
    set({ preference });
    AsyncStorage.setItem(THEME_KEY, preference);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        set({ preference: stored, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },
}));
