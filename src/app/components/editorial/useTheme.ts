import { useCallback, useEffect, useState } from 'react';

// Editorial light/dark theme manager. Light is the default; the user's choice
// persists in localStorage and toggles the `dark` class on <html>. Pairs with
// the no-flash inline script in index.html.
const STORAGE_KEY = 'apes-theme';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  // Sync state to the already-applied DOM theme after mount (no hydration flash).
  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const setAndPersist = useCallback((next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setAndPersist(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setAndPersist]);

  return { theme, toggleTheme, setTheme: setAndPersist };
}
