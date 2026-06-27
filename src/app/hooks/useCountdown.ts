import { useEffect, useRef, useState } from 'react';

/**
 * Server-authoritative countdown. Seed `deadlineTs` as
 *   Date.now() + time_limit_seconds * 1000
 * using the *remaining seconds* the server returned (clock-skew safe).
 * Fires `onExpire` exactly once when the remaining time reaches zero.
 *
 * Returns the remaining whole seconds, or null when there is no deadline.
 */
export function useCountdown(deadlineTs: number | null, onExpire: () => void): number | null {
  const [remainingSec, setRemainingSec] = useState<number | null>(
    deadlineTs === null ? null : Math.max(0, Math.round((deadlineTs - Date.now()) / 1000))
  );
  const firedRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Reset the one-shot guard whenever a new deadline is set.
  useEffect(() => { firedRef.current = false; }, [deadlineTs]);

  useEffect(() => {
    if (deadlineTs === null) { setRemainingSec(null); return; }
    const tick = () => {
      const rem = Math.max(0, Math.round((deadlineTs - Date.now()) / 1000));
      setRemainingSec(rem);
      if (rem <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpireRef.current();
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [deadlineTs]);

  return remainingSec;
}

/** Compute a deadline timestamp (ms) from a server "remaining seconds" value. */
export function deadlineFromRemaining(timeLimitSeconds: number | null | undefined): number | null {
  return timeLimitSeconds != null && timeLimitSeconds > 0
    ? Date.now() + timeLimitSeconds * 1000
    : null;
}
