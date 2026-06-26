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
 * Mayer's Signaling fallback: the model is supposed to wrap the key phrase of each step in
 * ==highlight== markers, but smaller models often skip the non-standard syntax. When the content
 * carries no ==...== of its own, deterministically promote the FIRST bold term on each
 * (non-heading) line to a highlight — models reliably emit **bold** for key terms — so the novice
 * always sees a yellow highlight per step regardless of the model's formatting compliance.
 */
const ensureSignalingHighlights = (content: string): string => {
  if (/==[^=]+==/.test(content)) return content; // model already highlighted — leave it
  return content
    .split('\n')
    .map((line) =>
      /^\s*#{1,6}\s/.test(line) ? line : line.replace(/\*\*(.+?)\*\*/, '==$1=='),
    )
    .join('\n');
};

/**
 * Step-by-step delivery for learners who benefit from scaffolding. Renders the
 * AI-structured numbered steps with signaling highlights via proper Markdown.
 */
export const GuidedStepsPlayer: React.FC<GuidedStepsPlayerProps> = ({ content, config, className }) => {
  const signaledContent = useMemo(() => ensureSignalingHighlights(content), [content]);
  const readingTime = useMemo(() => estimateReadingTime(signaledContent), [signaledContent]);

  return (
    <PlayerShell
      accent="indigo"
      readingTime={readingTime}
      className={className}
      measure="64ch"
    >
      <SafeMarkdown
        content={signaledContent}
        className={cn(
          academicProse,
          // Numbered steps get a little more air and an indigo marker
          '[&_ol]:space-y-4 [&_ol>li]:pl-2 [&_ol]:marker:text-indigo-500 [&_ol]:marker:font-semibold',
          // Mayer's Signaling — make the cues unmistakable (guided player only):
          // key technical terms become amber keyword chips...
          '[&_strong]:!bg-amber-100 [&_strong]:!text-amber-900 [&_strong]:!font-bold [&_strong]:!rounded [&_strong]:!px-1 [&_strong]:!py-0.5 [&_strong]:!box-decoration-clone',
          // ...and the single key concept per step gets a clear yellow highlighter.
          '[&_mark]:!bg-yellow-300 [&_mark]:!text-stone-900 [&_mark]:!font-semibold [&_mark]:!rounded [&_mark]:!px-1 [&_mark]:!py-0.5 [&_mark]:!box-decoration-clone',
        )}
      />

      {config?.use_highlights && (
        <div className="mt-6 flex items-center gap-2 border-t border-stone-200/80 pt-4 text-[12px] text-stone-500">
          <Highlighter className="h-3.5 w-3.5 text-amber-500" />
          <span>Coloured terms and highlights flag the key idea in each step.</span>
        </div>
      )}
    </PlayerShell>
  );
};
