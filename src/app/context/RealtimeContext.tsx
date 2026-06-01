import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { notificationsApi } from '../services/api';

/* ── Echo singleton (module-level) ───────────────────────────────────── */
let echoInstance: Echo<'reverb'> | null = null;

function getEchoInstance(): Echo<'reverb'> | null {
  if (echoInstance) return echoInstance;

  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST;
  const port = Number(import.meta.env.VITE_REVERB_PORT);

  if (!key || !host || !port) {
    // Graceful degradation: env vars missing → no WebSocket
    return null;
  }

  (window as unknown as Record<string, unknown>).Pusher = Pusher;

  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? 'https';
  const tls = scheme === 'https';
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: tls,
    enabledTransports: tls ? ['ws', 'wss'] : ['ws'],
    authEndpoint: `${import.meta.env.VITE_API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://localhost:8000'}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
      },
    },
  } as ConstructorParameters<typeof Echo>[0]);

  return echoInstance;
}

/* ── Types ─────────────────────────────────────────────────────────────── */

type NotifType =
  | 'assignment'
  | 'quiz'
  | 'message'
  | 'achievement'
  | 'reminder'
  | 'announcement'
  | 'grade'
  | 'info'
  | 'warning'
  | 'success'
  | 'danger'
  | 'course_update';

interface RealtimeNotification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  time: string;
}

interface RealtimeEvent {
  type: 'notification' | 'badge' | 'refresh';
  payload: Record<string, unknown>;
  receivedAt: number;
}

interface RealtimeContextType {
  /** Current unread notification count (updates in real-time) */
  unreadCount: number;
  /** Latest notifications received via WebSocket */
  notifications: RealtimeNotification[];
  /** Trigger value that changes when a relevant event fires (use for useEffect deps) */
  refreshTrigger: number;
  /** Last event received (useful for conditional refresh logic) */
  lastEvent: RealtimeEvent | null;
  /** Manually decrement unread count (e.g. after marking read) */
  decrementUnread: () => void;
  /** Manually increment unread count */
  incrementUnread: () => void;
  /** Reset unread to a specific value */
  setUnreadCount: (n: number) => void;
  /** Manually refresh count from server */
  refreshUnreadCount: () => Promise<void>;
  /** Whether Echo connected successfully */
  connected: boolean;
}

/* ── Context ───────────────────────────────────────────────────────────── */

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connected, setConnected] = useState(false);

  const channelRef = useRef<ReturnType<Echo<'reverb'>['private']> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Initial count fetch ───────────────────────────────────────────── */
  useEffect(() => {
    if (!mounted) return;
    notificationsApi
      .list()
      .then((r) => {
        const raw: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
        const unread = raw.filter((n) => !(n.read as boolean)).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [mounted]);

  /* ── WebSocket setup ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!mounted) return;
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const echo = getEchoInstance();
    if (!echo) return; // env vars missing

    try {
      const channel = echo.private(`user.${userId}`);
      channelRef.current = channel;

      channel.listen('.notification.new', (data: Record<string, unknown>) => {
        const newNotif: RealtimeNotification = {
          id: String(data.id ?? Date.now()),
          type: (data.type as NotifType) ?? 'info',
          title: String(data.title ?? ''),
          body: String(data.body ?? ''),
          read: false,
          time: new Date().toISOString(),
        };

        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
        setRefreshTrigger((t) => t + 1);
        setLastEvent({
          type: 'notification',
          payload: data,
          receivedAt: Date.now(),
        });
        setConnected(true);
      });

      channel.listen('.notification.badge', (data: { unread_count?: number }) => {
        if (typeof data.unread_count === 'number') {
          setUnreadCount(data.unread_count);
        }
        setLastEvent({
          type: 'badge',
          payload: data as Record<string, unknown>,
          receivedAt: Date.now(),
        });
        setConnected(true);
      });

      // Best-effort connection detection
      (echo.connector as unknown as { socket?: { state?: string } })?.socket;

    } catch (err) {
      console.error('[Realtime] Failed to subscribe to notification channel:', err);
    }

    return () => {
      if (channelRef.current) {
        try {
          echoInstance?.leave(`user.${userId}`);
        } catch {
          /* ignore */
        }
        channelRef.current = null;
      }
    };
  }, []);

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const decrementUnread = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const incrementUnread = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const r = await notificationsApi.list();
      const raw: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      setUnreadCount(raw.filter((n) => !(n.read as boolean)).length);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        unreadCount,
        notifications,
        refreshTrigger,
        lastEvent,
        decrementUnread,
        incrementUnread,
        setUnreadCount,
        refreshUnreadCount,
        connected,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
