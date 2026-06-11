import React, { useMemo, useState } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { List } from 'lucide-react';

interface VisualDiscoveryPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Visual Discovery Player — for visual VARK learners.
 * Wider layout with emphasis on headings, tables, and a floating TOC.
 */
export const VisualDiscoveryPlayer: React.FC<VisualDiscoveryPlayerProps> = ({ content, config, className }) => {
  const [showToc, setShowToc] = useState(false);

  // Extract headings for TOC
  const headings = useMemo(() => {
    const matches = [...content.matchAll(/^#{1,3}\s+(.+)$/gm)];
    return matches.map((m, i) => ({ id: `section-${i}`, text: m[1] }));
  }, [content]);

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
      {headings.length > 0 && (
        <div className="flex justify-end rounded-t-xl border-b bg-emerald-50 px-4 py-2">
          <button
            onClick={() => setShowToc(v => !v)}
            className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            {showToc ? 'Hide' : 'Structure'}
          </button>
        </div>
      )}

      {/* Inline TOC */}
      {showToc && headings.length > 0 && (
        <div className="border-b bg-emerald-50/50 px-4 py-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Section overview
          </p>
          <ul className="space-y-1">
            {headings.map((h) => (
              <li key={h.id} className="text-sm text-emerald-800">
                • {h.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content — wider layout, table-friendly */}
      <div
        className="prose prose-sm max-w-none p-5
          [&_h2]:text-emerald-900 [&_h2]:border-b [&_h2]:border-emerald-200 [&_h2]:pb-1 [&_h2]:mb-3
          [&_h3]:text-emerald-800 [&_h3]:font-semibold
          [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
          [&_th]:bg-emerald-100 [&_th]:text-emerald-900 [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
          [&_td]:border [&_td]:border-emerald-100 [&_td]:px-3 [&_td]:py-2
          [&_tr:nth-child(even)_td]:bg-emerald-50/50
          [&_strong]:text-emerald-900
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
          [&_p]:mb-3"
        style={{ maxWidth: '62rem' }}
      >
        <SafeMarkdown content={content} />
      </div>
    </div>
  );
};
