/**
 * Engagement telemetry — measures REAL active time-on-task per page/activity
 * and emits discrete learner activity events to the backend.
 *
 * Model (Moodle Timestat / LearnUpon style):
 *   - A per-context timer accumulates `active_seconds` only while the learner is
 *     genuinely engaged: the tab is visible AND there has been input within the
 *     idle window. Switching tabs or going idle pauses the timer.
 *   - A heartbeat flushes accumulated active seconds every HEARTBEAT_MS so a
 *     crash/close loses at most one interval.
 *   - On page unload a final flush is sent with `fetch(keepalive)` so the last
 *     slice of time-on-task is not lost.
 *
 * Backend endpoints used (all already exist):
 *   POST /engagement/events          (event_type: 'heartbeat' carries active_seconds in `value`)
 *   POST /engagement/session/open    (opens a login session)
 *   POST /engagement/session/close   (closes it)
 *   POST /engagement/materials/{id}/interact
 */

import { engagementApi, BASE_URL } from './api';

const HEARTBEAT_MS = 15_000; // flush cadence
const IDLE_MS      = 60_000; // no input for this long → paused (matches config/engagement.idle_seconds)
const TICK_MS      = 1_000;  // active-time resolution

export interface TrackingContext {
  resourceType: string;          // 'lesson' | 'activity' | 'quiz' | 'page' | ...
  resourceId?: string | null;    // UUID where applicable
  courseId?: string | null;
}

type EventPayload = {
  event_type: string;
  course_id?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  value?: number | null;
  metadata?: Record<string, unknown>;
  device_type?: string;
  login_session_id?: string | null;
};

function deviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function loginSessionId(): string | null {
  return localStorage.getItem('login_session_id');
}

class EngagementTracker {
  private context: TrackingContext | null = null;
  private activeSeconds = 0;
  private lastActivity = Date.now();
  private idle = false;
  private visible = typeof document !== 'undefined' ? !document.hidden : true;

  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private listenersAttached = false;

  /** Attach global listeners once (call from the app root). Idempotent. */
  init(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const markActive = () => {
      this.lastActivity = Date.now();
      if (this.idle) this.idle = false;
    };
    ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach((evt) =>
      window.addEventListener(evt, markActive, { passive: true }),
    );

    document.addEventListener('visibilitychange', () => {
      this.visible = !document.hidden;
      if (this.visible) {
        this.lastActivity = Date.now();
        this.emit('tab_focus');
      } else {
        // Going hidden — flush what we have so far and pause.
        this.flush(false);
        this.emit('tab_blur');
      }
    });

    // Final flush that survives unload (axios would be cancelled).
    const finalFlush = () => this.flush(true);
    window.addEventListener('pagehide', finalFlush);
    window.addEventListener('beforeunload', finalFlush);

    this.tickTimer = setInterval(() => this.tick(), TICK_MS);
    this.heartbeatTimer = setInterval(() => this.flush(false), HEARTBEAT_MS);
  }

  /** Whether the learner is currently engaged with the active context. */
  private engaged(): boolean {
    return !!this.context && this.visible && !this.idle;
  }

  private tick(): void {
    if (!this.context) return;
    if (Date.now() - this.lastActivity > IDLE_MS) {
      if (!this.idle) {
        this.idle = true;
        this.emit('page_idle');
      }
      return;
    }
    if (this.engaged()) this.activeSeconds += TICK_MS / 1000;
  }

  /**
   * Begin tracking a new page/activity. Flushes the previous context first.
   * Optionally emits a discrete view event (e.g. 'content_view').
   */
  start(context: TrackingContext, viewEvent?: string): void {
    if (this.context) this.flush(false);
    this.context = context;
    this.activeSeconds = 0;
    this.lastActivity = Date.now();
    this.idle = false;
    if (viewEvent) this.emit(viewEvent);
  }

  /** Stop tracking the current context and flush remaining active time. */
  stop(): void {
    this.flush(false);
    this.context = null;
    this.activeSeconds = 0;
  }

  /** Flush accumulated active seconds for the current context as a heartbeat. */
  flush(useKeepalive: boolean): void {
    if (!this.context) return;
    const seconds = Math.round(this.activeSeconds);
    if (seconds <= 0) return;
    this.activeSeconds = 0;

    const payload: EventPayload = {
      event_type: 'heartbeat',
      course_id: this.context.courseId ?? null,
      resource_type: this.context.resourceType,
      resource_id: this.context.resourceId ?? null,
      value: seconds,
      device_type: deviceType(),
      login_session_id: loginSessionId(),
    };

    if (useKeepalive) {
      this.sendKeepalive(payload);
    } else {
      engagementApi.logEvent(payload as Record<string, unknown>).catch(() => {});
    }
  }

  /** Emit a discrete event for the current (or given) context. */
  emit(eventType: string, extra?: Partial<EventPayload>): void {
    const ctx = this.context;
    const payload: EventPayload = {
      event_type: eventType,
      course_id: extra?.course_id ?? ctx?.courseId ?? null,
      resource_type: extra?.resource_type ?? ctx?.resourceType ?? null,
      resource_id: extra?.resource_id ?? ctx?.resourceId ?? null,
      value: extra?.value ?? null,
      metadata: extra?.metadata,
      device_type: deviceType(),
      login_session_id: loginSessionId(),
    };
    engagementApi.logEvent(payload as Record<string, unknown>).catch(() => {});
  }

  /** Token-authed flush that survives page unload. sendBeacon can't set the
   *  Authorization header, so we use fetch(keepalive) instead. */
  private sendKeepalive(payload: EventPayload): void {
    try {
      const token = localStorage.getItem('auth_token');
      fetch(`${BASE_URL}/engagement/events`, {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      /* best-effort */
    }
  }
}

export const telemetry = new EngagementTracker();

/**
 * Open a login session if one isn't already recorded (e.g. after a token
 * restore on app reload). Login itself returns a session id; this covers
 * reloads where the user is already authenticated.
 */
export async function ensureLoginSession(): Promise<void> {
  if (loginSessionId()) return;
  try {
    const res = await engagementApi.sessionOpen(deviceType());
    const id = res.data?.session_id;
    if (id) localStorage.setItem('login_session_id', id);
  } catch {
    /* non-fatal */
  }
}
