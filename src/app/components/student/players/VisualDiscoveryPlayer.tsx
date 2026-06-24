import React, { useMemo, useState } from 'react';
import { SafeMarkdown } from '../SafeMarkdown';
import { PlayerShell, academicProse, estimateReadingTime } from './PlayerShell';
import type { ModeConfig } from '@/app/types/personalization';
import { cn } from '@/app/components/ui/utils';
import { LayoutList, ArrowDown, Workflow } from 'lucide-react';

interface VisualDiscoveryPlayerProps {
  content: string;
  config?: ModeConfig;
  className?: string;
}

interface ProcessBlock {
  title: string;
  steps: Array<{ title: string; caption: string }>;
  pre: string;   // markdown before the diagram
  post: string;  // markdown after the diagram
}

const LIST_RE = /^\s*(?:\d+\.|[-*])\s+(.*)$/;        // mirrors SafeMarkdown's list rules
const HEADING_RE = /^#{1,3}\s+(.+)$/;

/** Strip inline markdown markers for use as plain diagram-node text. */
function stripInline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/==(.+?)==/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim();
}

/** Split a step into a bold-led title + caption (e.g. "**DNS lookup** — the …"). */
function splitStep(item: string): { title: string; caption: string } {
  const bold = item.match(/^\s*\*\*(.+?)\*\*\s*(?:[—\-:]\s*)?(.*)$/);
  if (bold) {
    return { title: stripInline(bold[1]), caption: stripInline(bold[2]) };
  }
  const plain = stripInline(item);
  const m = plain.match(/^(.{0,40}?)(?:[—\-:]\s+)(.*)$/);
  if (m) return { title: m[1].trim(), caption: m[2].trim() };
  return { title: plain, caption: '' };
}

/**
 * Find the first contiguous list block (≥2 items) and turn it into a process
 * description, capturing the immediately-preceding heading as the title.
 */
function extractProcess(content: string): ProcessBlock | null {
  const lines = content.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (LIST_RE.test(lines[i])) {
      start = i;
      let j = i;
      while (j < lines.length && (LIST_RE.test(lines[j]) || lines[j].trim() === '')) {
        if (LIST_RE.test(lines[j])) end = j;
        j++;
      }
      break;
    }
  }
  if (start === -1 || end === -1) return null;

  const items = lines.slice(start, end + 1).filter(l => LIST_RE.test(l)).map(l => (l.match(LIST_RE) as RegExpMatchArray)[1]);
  if (items.length < 2) return null;

  // Preceding heading (skipping blank lines) becomes the diagram title and is removed.
  let headingIdx = -1;
  for (let i = start - 1; i >= 0 && i >= start - 3; i--) {
    if (lines[i].trim() === '') continue;
    if (HEADING_RE.test(lines[i])) headingIdx = i;
    break;
  }
  const title = headingIdx >= 0 ? (lines[headingIdx].match(HEADING_RE) as RegExpMatchArray)[1].trim() : 'How it works';
  const preEnd = headingIdx >= 0 ? headingIdx : start;

  return {
    title,
    steps: items.map(splitStep),
    pre: lines.slice(0, preEnd).join('\n').trim(),
    post: lines.slice(end + 1).join('\n').trim(),
  };
}

/** Numbered, connected step cards — a content-derived "how it works" flow. */
const ProcessFlow: React.FC<{ title: string; steps: Array<{ title: string; caption: string }> }> = ({ title, steps }) => (
  <figure className="my-5 rounded-2xl border border-teal-200/70 bg-teal-50/30 px-4 py-5 sm:px-6">
    <figcaption className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
      <Workflow className="h-3.5 w-3.5" />
      {title}
    </figcaption>
    <ol className="flex flex-col items-stretch gap-0">
      {steps.map((s, i) => (
        <li key={i} className="flex flex-col items-stretch">
          <div className="flex items-start gap-3 rounded-xl border border-teal-200/80 bg-white px-4 py-3 shadow-sm">
            <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-[13px] font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-stone-900">{s.title}</p>
              {s.caption && <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{s.caption}</p>}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex justify-center py-1 text-teal-400" aria-hidden>
              <ArrowDown className="h-4 w-4" />
            </div>
          )}
        </li>
      ))}
    </ol>
  </figure>
);

/**
 * Structure-forward delivery: emphasises headings and tables with an elegant,
 * collapsible overview so learners can scan the shape of the material first, and
 * renders any process in the content as a visual step-by-step flow diagram.
 */
export const VisualDiscoveryPlayer: React.FC<VisualDiscoveryPlayerProps> = ({ content, className }) => {
  const [showOverview, setShowOverview] = useState(true);
  const readingTime = useMemo(() => estimateReadingTime(content), [content]);

  const headings = useMemo(() => {
    const matches = [...content.matchAll(/^#{1,3}\s+(.+)$/gm)];
    return matches.map((m, i) => ({ id: `section-${i}`, text: m[1].trim() }));
  }, [content]);

  const process = useMemo(() => extractProcess(content), [content]);

  const proseClass = cn(
    academicProse,
    // Headings as visual anchors; tables in the lesson's accent
    '[&_h2]:border-b [&_h2]:border-teal-200/70 [&_h2]:pb-1.5',
    '[&_th]:bg-teal-50/70 [&_th]:border-teal-200 [&_td]:border-teal-100/80',
    '[&_tr:nth-child(even)_td]:bg-teal-50/30',
  );

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
      {process ? (
        <>
          {process.pre && <SafeMarkdown content={process.pre} className={proseClass} />}
          <ProcessFlow title={process.title} steps={process.steps} />
          {process.post && <SafeMarkdown content={process.post} className={proseClass} />}
        </>
      ) : (
        <SafeMarkdown content={content} className={proseClass} />
      )}
    </PlayerShell>
  );
};
