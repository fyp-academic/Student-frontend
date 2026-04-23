import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, coursesApi } from "../services/api";
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
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

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#f59e0b"];

const typeIcon: Record<string, React.ElementType> = { assignment: FileText, quiz: HelpCircle, assessment: Zap };
const typeColor: Record<string, string>            = { assignment: "#2563eb", quiz: "#7c3aed", assessment: "#0891b2" };

export function Dashboard() {
  const { user } = useAuth();
  const [hub,     setHub]     = useState<Record<string, unknown> | null>(null);
  const [courses, setCourses] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    dashboardApi.studentHub()
      .then(r => setHub(r.data.data ?? r.data))
      .catch(() => {});
    coursesApi.myCourses()
      .then(r => setCourses((r.data.data ?? r.data ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

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

  const upcomingDeadlines = ((hub?.upcoming_deadlines as Record<string, unknown>[] | undefined) ?? []).slice(0, 5);
  const recentActivity    = ((hub?.recent_activity    as Record<string, unknown>[] | undefined) ?? []).slice(0, 4);

  const enrolledCount  = Number(hub?.enrolled_courses   ?? courses.length);
  const lessonsCount   = Number(hub?.lessons_completed  ?? 0);
  const pendingCount   = Number(hub?.pending_tasks      ?? 0);
  const riskSignal     = String(hub?.risk_signal        ?? 'active') as 'active' | 'inactive';

  const stats = [
    { label: "Enrolled Courses",  value: String(enrolledCount), icon: BookOpen,   color: "#2563eb", bg: "#eff6ff", trend: "This semester"         },
    { label: "Lessons Completed", value: String(lessonsCount),  icon: CheckCircle, color: "#22c55e", bg: "#f0fdf4", trend: "Total completed"       },
    { label: "Pending Tasks",     value: String(pendingCount),  icon: Clock,       color: "#f59e0b", bg: "#fffbeb", trend: "Across all courses"     },
    {
      label: "At-Risk Check",
      value: riskSignal === "active" ? "Active" : "Inactive",
      icon:  riskSignal === "active" ? ShieldCheck : AlertTriangle,
      color: riskSignal === "active" ? "#10b981"  : "#ef4444",
      bg:    riskSignal === "active" ? "#ecfdf5"  : "#fef2f2",
      trend: riskSignal === "active" ? "All signals normal" : "Review support plan",
    },
  ];

  const firstName = String((user as Record<string,unknown> | null)?.name ?? 'Student').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
          boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p style={{ fontSize: "13px", color: "#93c5fd", fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-white mt-1" style={{ fontSize: "22px", fontWeight: 700 }}>
              Welcome back, {firstName}! 👋
            </h1>
            <p style={{ fontSize: "14px", color: "#bfdbfe", marginTop: "4px" }}>
              You have <span className="text-white font-semibold">{pendingCount} pending tasks</span> and{" "}
              <span className="text-white font-semibold">{upcomingDeadlines.length} upcoming deadlines</span>.
            </p>
            {hub?.streak_days && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Flame size={15} color="#fbbf24" />
                  <span style={{ fontSize: "13px", color: "#fef3c7" }}>{String(hub.streak_days)}-day streak!</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <NavLink
              to="/my-courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-blue-700 transition-all hover:shadow-md"
              style={{ backgroundColor: "white", fontSize: "13px", fontWeight: 600 }}
            >
              My Courses <ArrowRight size={14} />
            </NavLink>
            <NavLink
              to="/assignments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-white transition-all hover:bg-white/10"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              Tasks <span className="bg-white/20 rounded-full px-1.5" style={{ fontSize: "11px" }}>{pendingCount}</span>
            </NavLink>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
        <div className="absolute -right-4 -bottom-14 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 flex flex-col gap-2"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <span style={{ fontSize: "26px", fontWeight: 700, color: "#1e293b" }}>{stat.value}</span>
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#64748b" }}>{stat.label}</p>
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
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Continue Learning</h2>
            <NavLink to="/my-courses" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors" style={{ fontSize: "13px" }}>
              View all <ChevronRight size={14} />
            </NavLink>
          </div>
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl overflow-hidden flex transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <div className="w-24 flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}55)` }}>
                  <span className="font-bold" style={{ fontSize: "11px", color: course.color }}>{course.code || 'COURSE'}</span>
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-white"
                        style={{ fontSize: "10px", backgroundColor: course.color, fontWeight: 600 }}
                      >
                        {course.code}
                      </span>
                      <p className="mt-1 text-slate-800" style={{ fontSize: "14px", fontWeight: 600 }}>
                        {course.title}
                      </p>
                      <p style={{ fontSize: "12px", color: "#64748b" }}>{course.instructor}</p>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: course.color, flexShrink: 0 }}>
                      {course.progress}%
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${course.progress}%`,
                          background: course.progress > 70
                            ? "linear-gradient(90deg, #22c55e, #16a34a)"
                            : course.progress > 40
                            ? "linear-gradient(90deg, #2563eb, #1d4ed8)"
                            : "linear-gradient(90deg, #f59e0b, #d97706)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {course.progress}% complete
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {course.lessonsLeft > 0 ? `${course.lessonsLeft} left` : 'Done'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Study Hours Chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Weekly Study Hours</h2>
              <span
                className="px-2.5 py-1 rounded-lg"
                style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: 600 }}
              >
                This Week: {weeklyData.reduce((s, d) => s + d.hours, 0).toFixed(1)} hrs
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v) => [`${v} hrs`, "Study Time"]}
                />
                <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Upcoming Deadlines</h2>
              <Calendar size={16} color="#2563eb" />
            </div>
            <div className="space-y-2.5">
{upcomingDeadlines.length === 0 && (
                <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No upcoming deadlines</p>
              )}
              {upcomingDeadlines.map((item, idx) => {
                const t     = String(item.type ?? 'assignment');
                const urgent = Boolean(item.urgent);
                const Icon  = typeIcon[t] ?? FileText;
                return (
                  <div
                    key={String(item.id ?? idx)}
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-slate-50"
                    style={{ borderLeft: urgent ? "3px solid #ef4444" : "3px solid #e2e8f0" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${typeColor[t] ?? '#2563eb'}15` }}
                    >
                      <Icon size={13} color={typeColor[t] ?? '#2563eb'} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-700 truncate" style={{ fontSize: "12px", fontWeight: 500 }}>
                        {String(item.title ?? item.name ?? '')}
                      </p>
                      <p style={{ fontSize: "11px", color: urgent ? "#ef4444" : "#94a3b8", marginTop: "2px", fontWeight: urgent ? 600 : 400 }}>
                        {urgent && "⚡ "}Due {String(item.due ?? item.due_date ?? '')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <NavLink
              to="/assignments"
              className="flex items-center justify-center gap-1.5 mt-3 py-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              View All Tasks <ArrowRight size={13} />
            </NavLink>
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Lessons This Semester</h2>
              <TrendingUp size={16} color="#22c55e" />
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v) => [`${v} lessons`, "Completed"]}
                />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} fill="url(#greenGrad)" dot={{ fill: "#22c55e", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Recent Activity</h2>
            <div className="space-y-3">
{recentActivity.length === 0 && (
                <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center" }}>No recent activity</p>
              )}
              {recentActivity.map((act, idx) => (
                <div key={String(act.id ?? idx)} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <BookOpen size={13} color="#2563eb" />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#475569" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{String(act.action ?? '')}</span>{' '}{String(act.item ?? act.description ?? '')}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
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
