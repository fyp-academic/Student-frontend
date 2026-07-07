import React, { useMemo, useState } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import { PlayerShell, academicProse, estimateReadingTime } from './PlayerShell';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { Network } from 'lucide-react';

interface DeepFocusPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

const CONNECTION_KEYWORDS = /\b(therefore|consequently|because|which means|this implies|hence|thus|as a result|in contrast|however|nevertheless)\b/i;

/**
 * Dense, distraction-free reading for advanced learners: a narrow measure,
 * scholarly typography, and on-demand surfacing of the logical connections
 * already present in the text.
 */
export const DeepFocusPlayer: React.FC<DeepFocusPlayerProps> = ({ content, config, className }) => {
  const [showConnections, setShowConnections] = useState(false);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const connectionSentences = useMemo(() => {
    const sentences = content.replace(/[#*>=_`-]/g, ' ').split(/(?<=[.!?])\s+/);
    return sentences.filter(s => CONNECTION_KEYWORDS.test(s)).map(s => s.trim()).slice(0, 6);
  }, [content]);

  const hasConnections = config?.show_connections !== false && connectionSentences.length > 0;

  return (
    <PlayerShell
      accent="slate"
      readingTime={readingTime}
      className={className}
      measure="58ch"
      action={
        hasConnections ? (
          <button
            onClick={() => setShowConnections(v => !v)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-clay transition-colors hover:text-clay-deep"
          >
            <Network className="h-3.5 w-3.5" />
            {showConnections ? 'Hide connections' : 'Key connections'}
          </button>
        ) : undefined
      }
      banner={
        showConnections && hasConnections ? (
          <div className="mx-6 mt-4 rounded-xl border border-clay/30/70 bg-clay/10/50 px-5 py-4 sm:mx-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-clay">
              How the ideas connect
            </p>
            <ul className="space-y-2">
              {connectionSentences.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm leading-snug text-stone-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-clay" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : undefined
      }
    >
      <SafeMarkdown
        content={content}
        className={cn(
          academicProse,
          // Tighter, scholarly density for advanced reading
          '[&_p]:my-3 [&_p]:leading-[1.7] text-[0.95rem]',
        )}
      />
    </PlayerShell>
  );
};
