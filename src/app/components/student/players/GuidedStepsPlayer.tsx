import React, { useMemo } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import { PlayerShell, academicProse, estimateReadingTime } from './PlayerShell';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { Highlighter } from 'lucide-react';

interface GuidedStepsPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Step-by-step delivery for learners who benefit from scaffolding. Renders the
 * AI-structured numbered steps with signaling highlights via proper Markdown.
 */
export const GuidedStepsPlayer: React.FC<GuidedStepsPlayerProps> = ({ content, config, className }) => {
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  return (
    <PlayerShell
      accent="indigo"
      readingTime={readingTime}
      className={className}
      measure="64ch"
    >
      <SafeMarkdown
        content={content}
        className={cn(
          academicProse,
          // Numbered steps get a little more air and an indigo marker
          '[&_ol]:space-y-4 [&_ol>li]:pl-2 [&_ol]:marker:text-indigo-500 [&_ol]:marker:font-semibold',
          '[&_mark]:bg-amber-200/70',
        )}
      />

      {config?.use_highlights && (
        <div className="mt-6 flex items-center gap-2 border-t border-stone-200/80 pt-4 text-[12px] text-stone-500">
          <Highlighter className="h-3.5 w-3.5 text-amber-500" />
          <span>Highlighted phrases mark the key idea in each step.</span>
        </div>
      )}
    </PlayerShell>
  );
};
