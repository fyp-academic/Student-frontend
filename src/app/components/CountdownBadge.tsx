import { Clock } from 'lucide-react';

const formatMMSS = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

/**
 * Color-coded countdown pill (blue → yellow ≤60s → red ≤30s).
 * Mirrors the quiz timer badge so every timed activity looks identical.
 */
export function CountdownBadge({ remainingSec, className = '' }: { remainingSec: number | null; className?: string }) {
  if (remainingSec === null) return null;
  const tone =
    remainingSec <= 30 ? 'bg-red-100 text-red-600'
    : remainingSec <= 60 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-blue-100 text-blue-700';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tone} ${className}`}>
      <Clock size={12} />
      {formatMMSS(remainingSec)}
    </div>
  );
}

export default CountdownBadge;
