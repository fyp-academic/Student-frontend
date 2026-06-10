import React, { useMemo, useRef } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { Lightbulb, BookOpen, ChevronDown } from 'lucide-react';

interface NarrativeExamplePlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Narrative Example Player — for example-based / Caring (C) learners.
 * Example scenario rendered in a distinct card, theory follows with a separator.
 */
export const NarrativeExamplePlayer: React.FC<NarrativeExamplePlayerProps> = ({ content, config, className }) => {
  const theoryRef = useRef<HTMLDivElement>(null);

  // Split on '---' separator between example and theory; fallback = no split
  const parts = useMemo(() => {
    const separatorIdx = content.indexOf('\n---\n');
    if (separatorIdx === -1) {
      // No separator — treat first paragraph as example, rest as theory
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
    <div className={cn('rounded-xl border bg-card shadow-sm overflow-hidden', className)}>
      {/* Example card */}
      <div className="border-b bg-amber-50">
        <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-2.5">
          <Lightbulb className="h-4 w-4 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Example first
          </span>
        </div>
        <div
          className="prose prose-sm max-w-none p-4
            [&_p]:mb-2 [&_p]:leading-relaxed [&_p]:text-amber-950
            [&_strong]:text-amber-900
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-amber-950"
          style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}
        >
          <SafeMarkdown content={parts.example} />
        </div>
        {hasTheory && (
          <div className="px-4 pb-3">
            <button
              onClick={scrollToTheory}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              See the concept
            </button>
          </div>
        )}
      </div>

      {/* Theory section */}
      {hasTheory && (
        <div ref={theoryRef}>
          <div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-2.5">
            <BookOpen className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              The concept explained
            </span>
          </div>
          <div
            className="prose prose-sm max-w-none p-5
              [&_p]:mb-3 [&_p]:leading-relaxed
              [&_strong]:text-slate-900
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
              [&_ol]:list-decimal [&_ol]:pl-5"
            style={{ fontSize: '0.9375rem', lineHeight: 1.7 }}
          >
            <SafeMarkdown content={parts.theory} />
          </div>
        </div>
      )}
    </div>
  );
};
