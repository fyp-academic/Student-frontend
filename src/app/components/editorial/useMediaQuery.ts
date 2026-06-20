import { useEffect, useState } from 'react';

// Generic media-query hook. Returns `false` on the server / first client render,
// then syncs after mount to avoid hydration mismatch.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

// Touch / coarse-pointer devices — used to disable the custom cursor.
export const useIsTouch = () => useMediaQuery('(pointer: coarse)');
