import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

/**
 * Academic-premium design system shared by all four lesson players.
 *
 * Goal: a cohesive, journal-grade reading surface — warm paper, serif headings,
 * a measured column and a calm palette. Each player passes a single restrained
 * `accent` for its affordances so the four feel like one design language.
 *
 * Silent-AI: never expose the player/mode name to students. The meta header is a
 * neutral "Lesson · ~N min read"; affordances use neutral labels only.
 */

export type PlayerAccent = 'indigo' | 'teal' | 'slate' | 'amber';

export const accentText: Record<PlayerAccent, string> = {
  indigo: 'text-clay',
  teal: 'text-teal-700',
  slate: 'text-slate-700',
  amber: 'text-amber-800',
};

export const accentSoftBg: Record<PlayerAccent, string> = {
  indigo: 'bg-clay/10/70',
  teal: 'bg-teal-50/70',
  slate: 'bg-slate-50',
  amber: 'bg-amber-50/70',
};

export const accentRule: Record<PlayerAccent, string> = {
  indigo: 'bg-clay/70',
  teal: 'bg-teal-400/70',
  slate: 'bg-slate-400/70',
  amber: 'bg-amber-400/70',
};

/**
 * Refined prose styling applied to the SafeMarkdown root. Serif headings, a calm
 * stone palette, generous line-height, and academic table/quote/mark treatment.
 */
export const academicProse = cn(
  'max-w-none text-[0.975rem] leading-[1.8] text-stone-700',
  '[&_h1]:font-serif [&_h1]:tracking-tight [&_h1]:text-stone-900 [&_h1]:text-[1.6rem] [&_h1]:font-semibold [&_h1]:mt-1 [&_h1]:mb-3',
  '[&_h2]:font-serif [&_h2]:tracking-tight [&_h2]:text-stone-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2',
  '[&_h3]:font-serif [&_h3]:text-stone-800 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-1.5',
  '[&_h4]:text-stone-800 [&_h4]:text-[0.95rem] [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-wide',
  '[&_p]:my-3.5 [&_p]:text-[0.975rem] [&_p]:leading-[1.8] [&_p]:text-stone-700',
  '[&_strong]:font-semibold [&_strong]:text-stone-900',
  '[&_em]:text-stone-700',
  '[&_code]:bg-stone-100 [&_code]:text-stone-800 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
  '[&_ul]:my-3.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:text-[0.975rem] [&_li]:text-stone-700 [&_ul>li]:pl-1 [&_ul]:marker:text-stone-400',
  '[&_ol]:my-3.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ol>li]:pl-1 [&_ol]:marker:text-stone-400 [&_ol]:marker:font-medium',
  '[&_mark]:bg-amber-200/60 [&_mark]:text-stone-900 [&_mark]:rounded [&_mark]:px-1 [&_mark]:py-0.5 [&_mark]:font-medium [&_mark]:box-decoration-clone',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-stone-600',
  '[&_table]:w-full [&_table]:my-5 [&_table]:border-collapse [&_table]:text-[0.9rem]',
  '[&_th]:border-b-2 [&_th]:border-stone-300 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-stone-900',
  '[&_td]:border-b [&_td]:border-stone-200/80 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top',
  '[&_tr:last-child_td]:border-b-0',
  '[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-stone-900',
);

interface PlayerShellProps {
  children: React.ReactNode;
  /** Neutral reading-time estimate (minutes). */
  readingTime?: number;
  accent?: PlayerAccent;
  /** Optional affordance rendered at the right of the meta header (e.g. a toggle). */
  action?: React.ReactNode;
  /** Optional content above the body (e.g. an inline panel/aside). */
  banner?: React.ReactNode;
  /** Constrain the reading measure (default ~68ch). */
  measure?: string;
  className?: string;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({
  children,
  readingTime,
  accent = 'slate',
  action,
  banner,
  measure = '68ch',
  className,
}) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-stone-200/80 bg-[#FCFBF8] shadow-sm',
        className,
      )}
    >
      {/* Meta header — neutral, never names the delivery mode */}
      <div className="flex items-center justify-between gap-3 px-6 pt-5 sm:px-8">
        <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-stone-400">
          <BookOpen className={cn('h-3.5 w-3.5', accentText[accent])} />
          <span>Lesson{readingTime ? ` · ~${readingTime} min read` : ''}</span>
        </div>
        {action}
      </div>
      <div className={cn('mx-6 mt-3 h-px sm:mx-8', accentRule[accent], 'opacity-40')} />

      {banner}

      {/* Body */}
      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto" style={{ maxWidth: measure }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/** Estimate reading time in whole minutes from raw markdown/text. */
export function estimateReadingTime(content: string, wpm = 200): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}
