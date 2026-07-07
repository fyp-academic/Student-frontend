import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { dashboardApi, coursesApi } from "../services/api";
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Flame,
  ChevronRight,
  FileText,
  HelpCircle,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// Warm editorial accent palette (clay + ochre + muted ink) for course tiles.
const COLORS = ["#b5613d", "#8c4a2f", "#c98a2e", "#6b655c", "#a0553a"];

const URL_RE = /(https?:\/\/[^\s→"'\]]+)/g;
function linkifyBody(text: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        style={{ color: "rgba(255,255,255,0.95)", textDecoration: "underline", wordBreak: "break-all" }}>
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}


export function Dashboard() {
  const { user } = useAuth();
  const { refreshTrigger } = useRealtime();
  const [hub,     setHub]     = useState<Record<string, unknown> | null>(null);
  const [courses, setCourses] = useState<Record<string, unknown>[]>([]);

  const loadDashboard = () => {
    dashboardApi.studentHub()
      .then(r => setHub(r.data.data ?? r.data))
      .catch(() => {});
    coursesApi.myCourses()
      .then(r => setCourses((r.data.data ?? r.data ?? []).slice(0, 3)))
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
  }, [refreshTrigger]);

  const weeklyData: { day: string; hours: number }[] =
    (hub?.weekly_study_hours as { day: string; hours: number }[] | undefined) ??
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => ({ day, hours: 0 }));

  const progressData: { month: string; completed: number }[] =
    (hub?.monthly_progress as { month: string; completed: number }[] | undefined) ?? [];

  const recentCourses = courses.map((c, i) => ({
    id:         String(c.id),
    code:       String(c.short_name ?? c.shortName ?? ''),
    title:      String(c.name ?? ''),
    instructor: String(c.instructor_name ?? c.instructor ?? ''),
    progress:   Number(c.completion_rate ?? 0),
    color:      COLORS[i % COLORS.length],
    lessonsLeft:Number((c.total_sections ?? 0)) - Number((c.completed_sections ?? 0)),
  }));

  const recentActivity = ((hub?.recent_activity as Record<string, unknown>[] | undefined) ?? []).slice(0, 4);
  const aiNudge        = hub?.ai_nudge as { title: string; body: string; sent_at: string; read: boolean; course_id: string } | null | undefined;

  const enrolledCount  = Number(hub?.enrolled_count ?? courses.length);
  const lessonsCount   = Number(hub?.lessons_completed  ?? 0);
  const pendingCount   = Number(hub?.pending_tasks      ?? 0);
  const riskSignal     = String(hub?.risk_signal        ?? 'active') as 'active' | 'inactive';

  const stats = [
    { label: "Enrolled Courses",  value: String(enrolledCount), icon: BookOpen,   color: "#b5613d", bg: "rgba(181,97,61,0.12)", trend: "This semester"         },
    { label: "Lessons Completed", value: String(lessonsCount),  icon: CheckCircle, color: "#5c7f5c", bg: "rgba(92,127,92,0.14)", trend: "Total completed"       },
    { label: "Pending Tasks",     value: String(pendingCount),  icon: Clock,       color: "#c98a2e", bg: "rgba(201,138,46,0.14)", trend: "Across all courses"     },
    {
      label: "At-Risk Check",
      value: riskSignal === "active" ? "Active" : "Inactive",
      icon:  riskSignal === "active" ? ShieldCheck : AlertTriangle,
      color: riskSignal === "active" ? "#5c7f5c"  : "#b5493d",
      bg:    riskSignal === "active" ? "rgba(92,127,92,0.14)"  : "rgba(181,73,61,0.14)",
      trend: riskSignal === "active" ? "All signals normal" : "Review support plan",
    },
  ];

  const firstName = String((user as Record<string,unknown> | null)?.name ?? 'Student').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-ink text-paper rounded-[18px] p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="eyebrow" style={{ color: "rgba(243,239,231,0.65)" }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display ed-display text-paper mt-2 text-step-5">
              Welcome back, {firstName}!
            </h1>
            <p className="text-step-2 mt-1" style={{ color: "rgba(243,239,231,0.8)" }}>
              You have <span className="text-paper font-semibold">{pendingCount} pending tasks</span> across your enrolled courses.
            </p>
            {!!hub?.streak_days && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Flame size={15} className="text-clay" />
                  <span className="text-step-1" style={{ color: "rgba(243,239,231,0.85)" }}>{String(hub.streak_days)}-day streak!</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <NavLink to="/my-courses" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-paper text-ink text-step-1 font-semibold transition-colors hover:bg-clay hover:text-white">
              My Courses <ArrowRight size={14} />
            </NavLink>
            <NavLink to="/assignments" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-paper/30 text-paper text-step-1 transition-colors hover:bg-paper/10">
              Tasks <span className="bg-paper/20 rounded-full px-1.5" style={{ fontSize: "11px" }}>{pendingCount}</span>
            </NavLink>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-[0.06]" style={{ backgroundColor: "#f6f3ee" }} />
        <div className="absolute -right-4 -bottom-14 w-36 h-36 rounded-full opacity-[0.06]" style={{ backgroundColor: "#f6f3ee" }} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="ed-card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <span className="font-display text-ink" style={{ fontSize: "26px", fontWeight: 500 }}>{stat.value}</span>
            </div>
            <div>
              <p className="text-step-1 text-ink-2">{stat.label}</p>
              <p style={{ fontSize: "11px", color: stat.color, fontWeight: 500, marginTop: "2px" }}>{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-step-3 text-ink">Continue Learning</h2>
            <NavLink to="/my-courses" className="flex items-center gap-1 text-clay hover:text-clay-deep transition-colors text-step-1">
              View all <ChevronRight size={14} />
            </NavLink>
          </div>
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <div key={course.id} className="ed-card overflow-hidden flex transition-transform hover:-translate-y-0.5">
                <div className="w-24 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${course.color}1f` }}>
                  <span className="font-bold" style={{ fontSize: "11px", color: course.color }}>{course.code || 'COURSE'}</span>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-white"
                        style={{ fontSize: "10px", backgroundColor: course.color, fontWeight: 600 }}
                      >
                        {course.code}
                      </span>
                      <p className="mt-1 text-ink text-step-2" style={{ fontWeight: 600 }}>
                        {course.title}
                      </p>
                      <p className="text-ink-2" style={{ fontSize: "12px" }}>{course.instructor}</p>
                    </div>
                    <span className="font-display" style={{ fontSize: "20px", fontWeight: 500, color: course.color, flexShrink: 0 }}>
                      {course.progress}%
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 rounded-full overflow-hidden bg-line/60">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-ink-2" style={{ fontSize: "11px" }}>
                        {course.progress}% complete
                      </span>
                      <span className="text-ink-2/70" style={{ fontSize: "11px" }}>
                        {course.lessonsLeft > 0 ? `${course.lessonsLeft} left` : 'Done'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Study Hours Chart */}
          <div className="ed-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-step-2 text-ink">Weekly Study Hours</h2>
              <span
                className="px-2.5 py-1 rounded-full text-clay"
                style={{ fontSize: "11px", backgroundColor: "rgba(181,97,61,0.12)", fontWeight: 600 }}
              >
                This Week: {weeklyData.reduce((s, d) => s + d.hours, 0).toFixed(1)} hrs
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--ink-2)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-2)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(181,97,61,0.08)" }}
                  contentStyle={{ borderRadius: "10px", border: "1px solid var(--line)", background: "var(--paper-2)", color: "var(--ink)", boxShadow: "var(--shadow-1)", fontSize: "12px" }}
                  formatter={(v) => [`${v} hrs`, "Study Time"]}
                />
                <Bar dataKey="hours" fill="var(--clay)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* AI Nudge Card */}
          <div className="bg-ink text-paper rounded-[18px] p-5 relative overflow-hidden">
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-clay">
                    <BookOpen size={15} color="white" />
                  </div>
                  <div>
                    <p className="text-paper" style={{ fontSize: "13px", fontWeight: 700 }}>Message from Your Instructor</p>
                    {aiNudge?.sent_at && (
                      <p style={{ fontSize: "10px", color: "rgba(243,239,231,0.6)" }}>{aiNudge.sent_at}</p>
                    )}
                  </div>
                </div>
              </div>

              {aiNudge ? (
                <>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(243,239,231,0.92)", marginBottom: "8px", lineHeight: "1.5" }}>
                    {aiNudge.title}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(243,239,231,0.78)", lineHeight: "1.7", whiteSpace: "pre-line", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                    {linkifyBody(String(aiNudge.body ?? ""))}
                  </p>
                  <NavLink to="/profile"
                    className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-clay hover:border-clay"
                    style={{ backgroundColor: "rgba(243,239,231,0.12)", color: "#f6f3ee", border: "1px solid rgba(243,239,231,0.2)" }}>
                    View my learning profile <ArrowRight size={11} />
                  </NavLink>
                </>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p style={{ fontSize: "12px", color: "rgba(243,239,231,0.7)", lineHeight: "1.6" }}>
                    No messages yet. Your instructor will reach out here with personalised guidance based on your progress.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="ed-card p-5">
            <h2 className="font-display text-step-2 text-ink" style={{ marginBottom: "12px" }}>Recent Activity</h2>
            <div className="space-y-3">
{recentActivity.length === 0 && (
                <p className="text-ink-2/70 text-step-1" style={{ textAlign: "center" }}>No recent activity</p>
              )}
              {recentActivity.map((act, idx) => (
                <div key={String(act.id ?? idx)} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(181,97,61,0.12)" }}
                  >
                    <BookOpen size={13} className="text-clay" />
                  </div>
                  <div>
                    <p className="text-ink-2" style={{ fontSize: "12px" }}>
                      <span className="text-ink" style={{ fontWeight: 600 }}>{String(act.action ?? '')}</span>{' '}{String(act.item ?? act.description ?? '')}
                    </p>
                    <p className="text-ink-2/70" style={{ fontSize: "11px", marginTop: "2px" }}>
                      {String(act.course ?? '')} · {String(act.time ?? act.created_at ?? '')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
