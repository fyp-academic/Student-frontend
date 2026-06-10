import React, { useMemo, useState } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { Network, Clock } from 'lucide-react';

interface DeepFocusPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

const CONNECTION_KEYWORDS = /\b(therefore|consequently|because|which means|this implies|hence|thus|as a result|in contrast|however|nevertheless)\b/gi;

/**
 * Deep Focus Player — for advanced, fast-paced learners.
 * Narrow reading column, dense academic prose, surfaced concept connections.
 */
export const DeepFocusPlayer: React.FC<DeepFocusPlayerProps> = ({ content, config, className }) => {
  const [showConnections, setShowConnections] = useState(false);

  // Estimate reading time (~200 wpm for advanced readers)
  const readingMinutes = useMemo(() => {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [content]);

  // Extract sentences containing connective language
  const connectionSentences = useMemo(() => {
    const sentences = content.split(/(?<=[.!?])\s+/);
    return sentences.filter(s => CONNECTION_KEYWORDS.test(s)).slice(0, 6);
  }, [content]);

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-white">
            ⊙
          </span>
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Deep focus mode
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            ~{readingMinutes} min
          </span>
          {config?.show_connections !== false && connectionSentences.length > 0 && (
            <button
              onClick={() => setShowConnections(v => !v)}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Network className="h-3.5 w-3.5" />
              Key connections
            </button>
          )}
        </div>
      </div>

      {/* Concept connections panel */}
      {showConnections && connectionSentences.length > 0 && (
        <div className="border-b bg-indigo-50/50 px-4 py-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
            Logical connections in this section
          </p>
          <ul className="space-y-1.5">
            {connectionSentences.map((s, i) => (
              <li key={i} className="text-sm text-indigo-900 leading-snug">
                <span className="mr-1 text-indigo-400">›</span>
                {s.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content — narrow reading column, compact density */}
      <div
        className="prose prose-sm max-w-2xl mx-auto p-6
          [&_p]:mb-2.5 [&_p]:leading-relaxed
          [&_strong]:font-semibold [&_strong]:text-slate-900
          [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-1.5
          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-slate-600
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5
          [&_ol]:list-decimal [&_ol]:pl-5"
        style={{ fontSize: '0.9rem', lineHeight: 1.55 }}
      >
        <SafeMarkdown content={content} />
      </div>
    </div>
  );
};
