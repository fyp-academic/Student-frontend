import type { ElementType, ReactNode } from 'react';
import { motion } from 'motion/react';
import { useScrollReveal } from './useScrollReveal';
import { usePrefersReducedMotion } from './useMediaQuery';

interface ScrollRevealProps {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
}

// Wraps children in a scroll-triggered reveal. Combines IntersectionObserver
// (useScrollReveal) with Motion. Under reduced-motion the content renders fully
// visible with no transform.
export default function ScrollReveal({
  children,
  as = 'div',
  delay = 0,
  y = 24,
  className = '',
}: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    const Tag = as as ElementType;
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    );
  }

  const MotionTag = (motion as Record<string, ElementType>)[as as string] ?? motion.div;

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
