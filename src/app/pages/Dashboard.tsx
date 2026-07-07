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
  LayoutGrid,
  List,
} from "lucide-react";
import { resolveAssetUrl } from "../components/ui/utils";
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

// White surface matching the sidebar — plain white with a hairline border.
const CARD = "bg-white border border-line rounded-[18px] shadow-editorial-1";

const URL_RE = /(https?:\/\/[^\s→"'\]]+)/g;
function linkifyBody(text: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        style={{ color: "#b5613d", textDecoration: "underline", wordBreak: "break-all" }}>
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
  const [courseView, setCourseView] = useState<'grid' | 'list'>('grid');

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
    image:      String(c.image ?? c.image_url ?? ''),
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

  const firstName = String((user as Record<string,unknown> | null)?.name ?? 'Student').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`${CARD} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="eyebrow">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display ed-display text-ink mt-2 text-step-5">
              Welcome back, {firstName}!
            </h1>
            <p className="text-step-2 mt-1 text-ink-2">
              You have <span className="text-ink font-semibold">{pendingCount} pending tasks</span> across your enrolled courses.
            </p>
            {!!hub?.streak_days && (
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Flame size={15} className="text-clay" />
                  <span className="text-step-1 text-ink-2">{String(hub.streak_days)}-day streak!</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <NavLink to="/my-courses" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-clay text-white text-step-1 font-semibold transition-colors hover:bg-clay-deep">
              My Courses <ArrowRight size={14} />
            </NavLink>
            <NavLink to="/assignments" className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-ink text-step-1 transition-colors hover:border-clay hover:text-clay">
              Tasks <span className="bg-clay/15 text-clay rounded-full px-1.5" style={{ fontSize: "11px" }}>{pendingCount}</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-step-3 text-ink">Continue Learning</h2>
            <div className="flex items-center gap-3">
              {/* Grid / list layout toggle */}
              <div className="flex items-center rounded-full border border-line overflow-hidden">
                <button
                  onClick={() => setCourseView('grid')}
                  title="Grid view"
                  aria-pressed={courseView === 'grid'}
                  className={`p-1.5 transition-colors ${courseView === 'grid' ? 'bg-clay text-white' : 'text-ink-2 hover:bg-black/5'}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setCourseView('list')}
                  title="List view"
                  aria-pressed={courseView === 'list'}
                  className={`p-1.5 transition-colors ${courseView === 'list' ? 'bg-clay text-white' : 'text-ink-2 hover:bg-black/5'}`}
                >
                  <List size={15} />
                </button>
              </div>
              <NavLink to="/my-courses" className="flex items-center gap-1 text-clay hover:text-clay-deep transition-colors text-step-1">
                View all <ChevronRight size={14} />
              </NavLink>
            </div>
          </div>

          {recentCourses.length === 0 ? (
            <div className={`${CARD} p-6 text-center text-ink-2 text-step-1`}>No courses yet.</div>
          ) : courseView === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentCourses.map((course) => (
                <div key={course.id} className={`${CARD} overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5`}>
                  {/* Course image */}
                  <div className="h-28 w-full relative overflow-hidden" style={{ backgroundColor: `${course.color}1f` }}>
                    {course.image ? (
                      <img src={resolveAssetUrl(course.image)} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen size={26} style={{ color: course.color }} />
                      </div>
                    )}
                    <span
                      className="absolute top-2 left-2 inline-block px-2 py-0.5 rounded-full text-white"
                      style={{ fontSize: "10px", backgroundColor: course.color, fontWeight: 600 }}
                    >
                      {course.code || 'COURSE'}
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-ink text-step-2 truncate" style={{ fontWeight: 600 }}>{course.title}</p>
                        <p className="text-ink-2 truncate" style={{ fontSize: "12px" }}>{course.instructor}</p>
                      </div>
                      <span className="font-display" style={{ fontSize: "18px", fontWeight: 500, color: course.color, flexShrink: 0 }}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="h-1.5 rounded-full overflow-hidden bg-line/60">
                        <div className="h-full rounded-full transition-all" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-ink-2" style={{ fontSize: "11px" }}>{course.progress}% complete</span>
                        <span className="text-ink-2/70" style={{ fontSize: "11px" }}>{course.lessonsLeft > 0 ? `${course.lessonsLeft} left` : 'Done'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <div key={course.id} className={`${CARD} overflow-hidden flex transition-transform hover:-translate-y-0.5`}>
                  <div className="w-28 flex-shrink-0 relative overflow-hidden" style={{ backgroundColor: `${course.color}1f` }}>
                    {course.image ? (
                      <img src={resolveAssetUrl(course.image)} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-bold" style={{ fontSize: "11px", color: course.color }}>{course.code || 'COURSE'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-white"
                          style={{ fontSize: "10px", backgroundColor: course.color, fontWeight: 600 }}
                        >
                          {course.code}
                        </span>
                        <p className="mt-1 text-ink text-step-2 truncate" style={{ fontWeight: 600 }}>{course.title}</p>
                        <p className="text-ink-2 truncate" style={{ fontSize: "12px" }}>{course.instructor}</p>
                      </div>
                      <span className="font-display" style={{ fontSize: "20px", fontWeight: 500, color: course.color, flexShrink: 0 }}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <div className="h-1.5 rounded-full overflow-hidden bg-line/60">
                        <div className="h-full rounded-full transition-all" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-ink-2" style={{ fontSize: "11px" }}>{course.progress}% complete</span>
                        <span className="text-ink-2/70" style={{ fontSize: "11px" }}>{course.lessonsLeft > 0 ? `${course.lessonsLeft} left` : 'Done'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly Study Hours Chart */}
          <div className={`${CARD} p-5`}>
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
          <div className={`${CARD} p-5`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-clay">
                    <BookOpen size={15} color="white" />
                  </div>
                  <div>
                    <p className="text-ink" style={{ fontSize: "13px", fontWeight: 700 }}>Message from Your Instructor</p>
                    {aiNudge?.sent_at && (
                      <p className="text-ink-2/70" style={{ fontSize: "10px" }}>{aiNudge.sent_at}</p>
                    )}
                  </div>
                </div>
              </div>

              {aiNudge ? (
                <>
                  <p className="text-ink" style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", lineHeight: "1.5" }}>
                    {aiNudge.title}
                  </p>
                  <p className="text-ink-2" style={{ fontSize: "11px", lineHeight: "1.7", whiteSpace: "pre-line", maxHeight: "260px", overflowY: "auto", paddingRight: "4px" }}>
                    {linkifyBody(String(aiNudge.body ?? ""))}
                  </p>
                  <NavLink to="/profile"
                    className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full text-xs font-semibold border border-line text-ink transition-colors hover:border-clay hover:text-clay">
                    View my learning profile <ArrowRight size={11} />
                  </NavLink>
                </>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-ink-2" style={{ fontSize: "12px", lineHeight: "1.6" }}>
                    No messages yet. Your instructor will reach out here with personalised guidance based on your progress.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${CARD} p-5`}>
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
