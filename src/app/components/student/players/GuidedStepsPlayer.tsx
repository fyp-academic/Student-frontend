import React, { useMemo } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';

interface GuidedStepsPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

/**
 * Guided Steps Player — for novice / slow-paced learners.
 * Renders AI-structured numbered steps with highlight markers and a step progress bar.
 */
export const GuidedStepsPlayer: React.FC<GuidedStepsPlayerProps> = ({ content, config, className }) => {
  // Preprocess ==highlight== markers → <mark>
  const processedContent = useMemo(() => {
    return content.replace(/==(.+?)==/g, '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>');
  }, [content]);

  // Count steps (numbered list items) for progress indicator
  const stepCount = useMemo(() => {
    const matches = content.match(/^\d+\./gm);
    return matches ? matches.length : 0;
  }, [content]);

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-t-xl border-b bg-blue-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            ①
          </span>
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
            Step-by-step mode
          </span>
        </div>
        {stepCount > 0 && (
          <span className="text-xs text-blue-600">{stepCount} steps</span>
        )}
      </div>

      {/* Content */}
      <div
        className="prose prose-sm max-w-none p-5 leading-relaxed
          [&_ol]:space-y-4 [&_ol>li]:relative [&_ol>li]:pl-2
          [&_strong]:text-blue-900
          [&_mark]:bg-yellow-200 [&_mark]:text-yellow-900 [&_mark]:rounded [&_mark]:px-0.5
          [&_ol]:list-decimal [&_ol]:pl-6
          [&_p]:mb-3"
        dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br/>') }}
        style={{ fontSize: '0.9375rem', lineHeight: 1.85 }}
      />

      {config?.use_highlights && (
        <div className="rounded-b-xl border-t bg-blue-50/60 px-4 py-2 text-[11px] text-blue-700">
          Highlighted terms are the key concepts for this step.
        </div>
      )}
    </div>
  );
};
