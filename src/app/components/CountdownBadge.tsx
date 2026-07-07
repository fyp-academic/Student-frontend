import { Clock } from 'lucide-react';

const formatMMSS = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Color-coded countdown pill (blue → yellow ≤60s → red ≤30s).
 * Mirrors the quiz timer badge so every timed activity looks identical.
 * `prominent` renders a larger banner-style timer for clear visibility above a quiz;
 * it also softly pulses while in the red (≤30s) zone.
 */
export function CountdownBadge({
  remainingSec, className = '', prominent = false,
}: { remainingSec: number | null; className?: string; prominent?: boolean }) {
  if (remainingSec === null) return null;
  const tone =
    remainingSec <= 30 ? 'bg-red-100 text-red-600'
    : remainingSec <= 60 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-clay/10 text-clay';
  if (prominent) {
    return (
      <div
        role="timer"
        aria-live="polite"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold tabular-nums shadow-sm ring-1 ring-black/5 ${tone} ${remainingSec <= 30 ? 'animate-pulse' : ''} ${className}`}
      >
        <Clock size={18} />
        <span className="uppercase tracking-wide text-[11px] font-semibold opacity-70">Time left</span>
        {formatMMSS(remainingSec)}
      </div>
    );
  }
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tone} ${className}`}>
      <Clock size={12} />
      {formatMMSS(remainingSec)}
    </div>
  );
}

export default CountdownBadge;
