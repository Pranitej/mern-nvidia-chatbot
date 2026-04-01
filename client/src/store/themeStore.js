import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '../config/config.js';

export const useThemeStore = create(persist(
  (set, get) => ({
    theme: config.ui.defaultTheme,
    toggle: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      set({ theme: next });
      document.documentElement.classList.toggle('dark', next === 'dark');
    },
    init: () => {
      const theme = get().theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    },
  }),
  { name: 'theme' }
));
