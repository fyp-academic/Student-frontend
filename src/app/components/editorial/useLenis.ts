import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePrefersReducedMotion } from './useMediaQuery';

// Initialise Lenis smooth scrolling on the client only. Skips entirely when the
// user prefers reduced motion (native scrolling is left intact).
export function useLenis() {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [prefersReduced]);
}
