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

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
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
