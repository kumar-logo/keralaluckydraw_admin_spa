import { create } from 'zustand';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'admin_theme';

const readInitial = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
};

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = readInitial();
  applyTheme(initial);
  return {
    theme: initial,
    toggleTheme: () => {
      const next: Theme = get().theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      set({ theme: next });
    },
    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },
  };
});
