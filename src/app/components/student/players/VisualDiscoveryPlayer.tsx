import React, { useMemo, useState } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import { PlayerShell, academicProse, estimateReadingTime } from './PlayerShell';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { LayoutList } from 'lucide-react';

interface VisualDiscoveryPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Structure-forward delivery: emphasises headings and tables with an elegant,
 * collapsible overview so learners can scan the shape of the material first.
 */
export const VisualDiscoveryPlayer: React.FC<VisualDiscoveryPlayerProps> = ({ content, className }) => {
  const [showOverview, setShowOverview] = useState(true);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const headings = useMemo(() => {
    const matches = [...content.matchAll(/^#{1,3}\s+(.+)$/gm)];
    return matches.map((m, i) => ({ id: `section-${i}`, text: m[1].trim() }));
  }, [content]);

  return (
    <PlayerShell
      accent="teal"
      readingTime={readingTime}
      className={className}
      measure="74ch"
      action={
        headings.length > 0 ? (
          <button
            onClick={() => setShowOverview(v => !v)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-teal-700 transition-colors hover:text-teal-900"
          >
            <LayoutList className="h-3.5 w-3.5" />
            {showOverview ? 'Hide overview' : 'Overview'}
          </button>
        ) : undefined
      }
      banner={
        showOverview && headings.length > 0 ? (
          <div className="mx-6 mt-4 rounded-xl border border-teal-200/70 bg-teal-50/50 px-5 py-4 sm:mx-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              In this lesson
            </p>
            <ol className="space-y-1.5">
              {headings.map((h, i) => (
                <li key={h.id} className="flex gap-2.5 text-sm text-stone-700">
                  <span className="font-serif font-semibold text-teal-600/80">{i + 1}.</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : undefined
      }
    >
      <SafeMarkdown
        content={content}
        className={cn(
          academicProse,
          // Headings as visual anchors; tables in the lesson's accent
          '[&_h2]:border-b [&_h2]:border-teal-200/70 [&_h2]:pb-1.5',
          '[&_th]:bg-teal-50/70 [&_th]:border-teal-200 [&_td]:border-teal-100/80',
          '[&_tr:nth-child(even)_td]:bg-teal-50/30',
        )}
      />
    </PlayerShell>
  );
};
