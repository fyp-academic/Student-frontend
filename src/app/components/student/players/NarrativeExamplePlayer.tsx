import React, { useMemo, useRef } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import { PlayerShell, academicProse, estimateReadingTime } from './PlayerShell';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { ChevronDown, Quote } from 'lucide-react';

interface NarrativeExamplePlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Example-first delivery for learners who grasp concepts through concrete cases.
 * The opening example sits in an elegant aside; the theory follows beneath.
 */
export const NarrativeExamplePlayer: React.FC<NarrativeExamplePlayerProps> = ({ content, className }) => {
  const theoryRef = useRef<HTMLDivElement>(null);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const parts = useMemo(() => {
    const separatorIdx = content.indexOf('\n---\n');
    if (separatorIdx === -1) {
      const firstBreak = content.indexOf('\n\n');
      if (firstBreak === -1) return { example: content, theory: '' };
      return {
        example: content.slice(0, firstBreak).trim(),
        theory: content.slice(firstBreak).trim(),
      };
    }
    return {
      example: content.slice(0, separatorIdx).trim(),
      theory: content.slice(separatorIdx + 5).trim(),
    };
  }, [content]);

  const hasTheory = parts.theory.trim() !== '';

  const scrollToTheory = () => {
    theoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PlayerShell
      accent="amber"
      readingTime={readingTime}
      className={className}
      measure="66ch"
      banner={
        <div className="mx-6 mt-4 rounded-xl border border-amber-200/70 bg-amber-50/50 px-5 py-4 sm:mx-8">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
            <Quote className="h-3.5 w-3.5" />
            <span>Start here</span>
          </div>
          <SafeMarkdown
            content={parts.example}
            className={cn(academicProse, 'text-[0.95rem] [&_p]:my-2.5')}
          />
          {hasTheory && (
            <button
              onClick={scrollToTheory}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-amber-800 transition-colors hover:text-amber-950"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              See the concept
            </button>
          )}
        </div>
      }
    >
      {hasTheory ? (
        <div ref={theoryRef}>
          <SafeMarkdown content={parts.theory} className={academicProse} />
        </div>
      ) : (
        <p className="text-sm text-stone-400">The explanation continues above.</p>
      )}
    </PlayerShell>
  );
};
