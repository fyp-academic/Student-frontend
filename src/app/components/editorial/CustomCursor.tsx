import { useEffect, useRef, useState } from 'react';
import { useIsTouch, usePrefersReducedMotion } from './useMediaQuery';

// A custom pointer-following cursor with a hover state on interactive elements.
// Fully disabled on touch / coarse-pointer devices and when reduced-motion is
// preferred — in those cases the native cursor is used and nothing renders.
export default function CustomCursor() {
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const enabled = !isTouch && !reduced;

  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId: number;

    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      const el = e.target as Element | null;
      const interactive = el?.closest?.('[data-cursor], a, button, [role="button"]');
      setHovering(Boolean(interactive));
    };

    const onLeave = () => setVisible(false);

    const render = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('pointermove', onMove);
    document.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(render);

    return () => {
      root.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={ringRef}
        className="fixed left-0 top-0 h-8 w-8 rounded-full border border-ink transition-[width,height,background-color] duration-300 ease-editorial"
        style={{
          width: hovering ? 56 : 32,
          height: hovering ? 56 : 32,
          marginLeft: hovering ? -28 : -16,
          marginTop: hovering ? -28 : -16,
          backgroundColor: hovering ? 'rgba(127,110,90,0.10)' : 'transparent',
        }}
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-ink"
      />
    </div>
  );
}
