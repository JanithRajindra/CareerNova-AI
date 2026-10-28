import { create } from 'zustand';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'careermatch_theme';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getInitialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {}
  return 'system';
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'light';
  }
  return mode;
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeState {
  theme: Theme; // Active effective theme applied to the DOM
  themeMode: ThemeMode; // User preference: 'light' | 'dark' | 'system'
  toggleTheme: () => void;
  setTheme: (theme: Theme | ThemeMode) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = getInitialMode();
  const initialResolved = resolveTheme(initialMode);

  // Apply immediately upon module load
  applyThemeToDocument(initialResolved);

  // Listen to OS system preference changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentMode = get().themeMode;
      if (currentMode === 'system') {
        const newResolved = getSystemPrefersDark() ? 'dark' : 'light';
        applyThemeToDocument(newResolved);
        set({ theme: newResolved });
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
  }

  return {
    theme: initialResolved,
    themeMode: initialMode,

    toggleTheme: () => {
      const currentResolved = get().theme;
      const nextTheme: Theme = currentResolved === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {}
      applyThemeToDocument(nextTheme);
      set({ theme: nextTheme, themeMode: nextTheme });
    },

    setTheme: (theme: Theme | ThemeMode) => {
      get().setThemeMode(theme as ThemeMode);
    },

    setThemeMode: (mode: ThemeMode) => {
      const resolved = resolveTheme(mode);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {}
      applyThemeToDocument(resolved);
      set({ theme: resolved, themeMode: mode });
    },
  };
});
