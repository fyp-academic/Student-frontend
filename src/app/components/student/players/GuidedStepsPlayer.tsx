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
 * Mayer's Signaling fallback — fully deterministic, independent of model formatting.
 * The model is supposed to wrap each step's key phrase in ==highlight== markers, but smaller
 * models (e.g. Haiku) often skip both ==...== AND **bold**, leaving nothing to highlight. So when
 * the content has no ==...== of its own, derive a highlight per line from the raw text:
 *   1. promote the first **bold** term (uses the model's own key-term pick), else
 *   2. for a numbered/bulleted step, highlight its lead phrase (up to the first dash/colon, or
 *      the first few words) — guaranteeing a yellow highlight on the step's subject.
 */
const ensureSignalingHighlights = (content: string): string => {
  if (/==[^=]+==/.test(content)) return content; // model already highlighted — respect it

  return content
    .split('\n')
    .map((line) => {
      if (/^\s*#{1,6}\s/.test(line)) return line;   // skip headings
      if (/^\s*-{3,}\s*$/.test(line)) return line;  // skip --- separators

      // 1) Promote the first bold term, if any.
      if (/\*\*(.+?)\*\*/.test(line)) {
        return line.replace(/\*\*(.+?)\*\*/, '==$1==');
      }

      // 2) No bold — highlight the lead phrase of a step line.
      const step = line.match(/^(\s*(?:\d+[.)]|[-*•])\s+)(.+)$/);
      if (step) {
        const [, prefix, body] = step;
        const sep = body.match(/^(.{2,60}?)\s+[—–-]\s+/) ?? body.match(/^(.{2,60}?):\s+/);
        const lead = (sep ? sep[1] : body.split(/\s+/).slice(0, 4).join(' ')).trim();
        if (lead && body.startsWith(lead)) {
          return `${prefix}==${lead}==${body.slice(lead.length)}`;
        }
      }

      return line;
    })
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
          '[&_ol]:space-y-4 [&_ol>li]:pl-2 [&_ol]:marker:text-clay [&_ol]:marker:font-semibold',
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
