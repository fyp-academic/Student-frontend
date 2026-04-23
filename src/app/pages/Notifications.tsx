import { useState, useEffect } from "react";
import {
  Bell, FileText, HelpCircle, MessageCircle, Award, AlertCircle,
  CheckCircle, Trash2,
} from "lucide-react";
import { notificationsApi } from "../services/api";

type NotifType = "assignment" | "quiz" | "message" | "achievement" | "reminder" | "announcement" | "grade" | "info" | "warning" | "success" | "danger" | "course_update";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  message?: string;
  time: string;
  timestamp?: string;
  read: boolean;
  course?: string;
  courseColor?: string;
}

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  assignment:   { icon: FileText,       color: "#2563eb", bg: "#eff6ff" },
  quiz:         { icon: HelpCircle,     color: "#7c3aed", bg: "#fdf4ff" },
  message:      { icon: MessageCircle,  color: "#0891b2", bg: "#f0fdfa" },
  achievement:  { icon: Award,          color: "#f59e0b", bg: "#fffbeb" },
  reminder:     { icon: AlertCircle,    color: "#dc2626", bg: "#fef2f2" },
  announcement: { icon: Bell,           color: "#475569", bg: "#f8fafc" },
  grade:        { icon: CheckCircle,    color: "#16a34a", bg: "#f0fdf4" },
  info:         { icon: Bell,           color: "#2563eb", bg: "#eff6ff" },
  warning:      { icon: AlertCircle,    color: "#f59e0b", bg: "#fffbeb" },
  success:      { icon: CheckCircle,    color: "#16a34a", bg: "#f0fdf4" },
  danger:       { icon: AlertCircle,    color: "#dc2626", bg: "#fef2f2" },
  course_update:{ icon: Bell,           color: "#7c3aed", bg: "#fdf4ff" },
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Unread", "Assignments", "Grades", "Announcements"];

  useEffect(() => {
    notificationsApi.list().then(r => {
      const raw: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      setNotifications(raw.map(n => ({
        id:        String(n.id),
        type:      (n.type as NotifType) ?? 'info',
        title:     String(n.title     ?? ''),
        body:      String(n.message   ?? n.body ?? ''),
        time:      String(n.timestamp ?? n.created_at ?? ''),
        read:      Boolean(n.read),
        course:    n.course as string | undefined,
        courseColor: n.course_color as string | undefined,
      })));
    }).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationsApi.markAllRead().catch(() => {});
  };
  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).catch(() => {});
  };
  const deleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationsApi.remove(id).catch(() => {});
  };

  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Assignments") return n.type === "assignment" || n.type === "reminder";
    if (filter === "Grades") return n.type === "grade";
    if (filter === "Announcements") return n.type === "announcement" || n.type === "course_update";
    return true;
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Notifications</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:bg-slate-50"
            style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}
          >
            <CheckCircle size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: filter === f ? 600 : 400,
              backgroundColor: filter === f ? "#2563eb" : "white",
              color: filter === f ? "white" : "#475569",
              borderColor: filter === f ? "#2563eb" : "#e2e8f0",
            }}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-white" style={{ fontSize: "9px", backgroundColor: filter === "Unread" ? "rgba(255,255,255,0.3)" : "#dc2626" }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <Bell size={32} color="#cbd5e1" className="mx-auto mb-3" />
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>No notifications here</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const cfg = typeConfig[notif.type] ?? typeConfig.info;
            const NIcon = cfg.icon;
            return (
              <div
                key={notif.id}
                className="bg-white rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer group"
                style={{
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                  borderLeft: !notif.read ? "3px solid #2563eb" : "3px solid transparent",
                }}
                onClick={() => markRead(notif.id)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                  <NIcon size={18} color={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p style={{ fontSize: "13px", fontWeight: !notif.read ? 700 : 500, color: "#1e293b" }}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {notif.course && (
                        <span
                          className="px-1.5 py-0.5 rounded-md"
                          style={{ fontSize: "9px", fontWeight: 700, backgroundColor: `${notif.courseColor}15`, color: notif.courseColor }}
                        >
                          {notif.course}
                        </span>
                      )}
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#2563eb" }} />
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", lineHeight: "1.5" }}>
                    {notif.body}
                  </p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>{notif.time}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
                  style={{ color: "#dc2626" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}