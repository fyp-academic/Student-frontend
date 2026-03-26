import { useState } from "react";
import {
  Bell, FileText, HelpCircle, MessageCircle, Award, AlertCircle,
  CheckCircle, Trash2,
} from "lucide-react";

type NotifType = "assignment" | "quiz" | "message" | "achievement" | "reminder" | "announcement" | "grade";

interface Notification {
  id: number;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  course?: string;
  courseColor?: string;
}

const initialNotifications: Notification[] = [
  { id: 1, type: "reminder", title: "⚡ Assignment Due Tomorrow", body: "CS301 Assignment 3 (Pandas DataFrames) is due tomorrow Feb 25 at 11:59 PM.", time: "2 hours ago", read: false, course: "CS301", courseColor: "#2563eb" },
  { id: 2, type: "quiz", title: "New Quiz Available", body: "MATH402 Quiz 5: Series & Sequences is now available. Due Feb 26, 2026.", time: "4 hours ago", read: false, course: "MATH402", courseColor: "#7c3aed" },
  { id: 3, type: "announcement", title: "Midterm Exam Rescheduled", body: "Your CS301 Midterm Exam has been moved to March 10, 2026. Check the course feed for details.", time: "6 hours ago", read: false, course: "CS301", courseColor: "#2563eb" },
  { id: 4, type: "grade", title: "Assignment Graded", body: "Assignment 2: Data Visualization received 92/100 points. Great work!", time: "1 day ago", read: false, course: "CS301", courseColor: "#2563eb" },
  { id: 5, type: "message", title: "New Forum Reply", body: "Adelfina Mambali replied to your question about NaN handling in the CS301 Forum.", time: "1 day ago", read: true, course: "CS301", courseColor: "#2563eb" },
  { id: 6, type: "achievement", title: "🏆 Achievement Unlocked!", body: "You've completed 5 consecutive days of studying. You earned the '5-Day Streak' badge!", time: "2 days ago", read: true },
  { id: 7, type: "assignment", title: "New Assignment Posted", body: "BIO301 Lab Report 4: Cell Division has been posted. Due March 1, 2026.", time: "2 days ago", read: true, course: "BIO301", courseColor: "#059669" },
  { id: 8, type: "grade", title: "Quiz Results Available", body: "CS301 Quiz 4 results are in: 14/15 (93%). Excellent performance!", time: "3 days ago", read: true, course: "CS301", courseColor: "#2563eb" },
  { id: 9, type: "reminder", title: "Live Session Reminder", body: "CS450 Live Q&A with Dr. James Liu is tomorrow at 3PM. Join via Zoom.", time: "3 days ago", read: true, course: "CS450", courseColor: "#0891b2" },
  { id: 10, type: "announcement", title: "Course Material Updated", body: "New lecture notes for MATH402 Chapter 8 are now available in the Materials section.", time: "4 days ago", read: true, course: "MATH402", courseColor: "#7c3aed" },
];

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  assignment: { icon: FileText, color: "#2563eb", bg: "#eff6ff" },
  quiz: { icon: HelpCircle, color: "#7c3aed", bg: "#fdf4ff" },
  message: { icon: MessageCircle, color: "#0891b2", bg: "#f0fdfa" },
  achievement: { icon: Award, color: "#f59e0b", bg: "#fffbeb" },
  reminder: { icon: AlertCircle, color: "#dc2626", bg: "#fef2f2" },
  announcement: { icon: Bell, color: "#475569", bg: "#f8fafc" },
  grade: { icon: CheckCircle, color: "#16a34a", bg: "#f0fdf4" },
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Unread", "Assignments", "Grades", "Announcements"];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const deleteNotif = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.read;
    if (filter === "Assignments") return n.type === "assignment" || n.type === "reminder";
    if (filter === "Grades") return n.type === "grade";
    if (filter === "Announcements") return n.type === "announcement";
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
            const cfg = typeConfig[notif.type];
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