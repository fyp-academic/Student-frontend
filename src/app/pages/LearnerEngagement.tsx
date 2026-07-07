import { useState, useEffect, useCallback } from "react";
import {
  Activity, AlertTriangle, BarChart2, BookOpen, Calendar,
  CheckCircle, Clock, Cpu, Info, Laptop, Monitor, RefreshCw,
  Smartphone, Star, TrendingUp, Zap,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { useNavigate } from "react-router";
import { engagementApi } from "../services/api";

// ── Types ────────────────────────────────────────────────────────────────────
interface ScoreBreakdown {
  login_consistency: number;
  content_completion: number;
  assessment_activity: number;
  forum_participation: number;
  pacing: number;
  live_session: number;
}
interface CourseScore {
  course_id: string;
  engagement_score: number;
  week_number: number;
  course?: { name: string };
  score_breakdown?: ScoreBreakdown;
  login_consistency_score: number;
  content_completion_score: number;
  assessment_activity_score: number;
  forum_participation_score: number;
  pacing_score: number;
  live_session_score: number;
}
interface Streak { current_streak_days: number; longest_streak_days: number; last_active_date: string }
interface LoginSession {
  id: string; started_at: string; ended_at: string | null;
  device_type: string; ip_address: string | null; duration_seconds: number | null; is_bounce: boolean;
}
interface ActivityEvent {
  id: string; event_type: string; occurred_at: string;
  course?: { name: string }; resource_type: string | null;
  resource_id: string | null; value: number | null; metadata: Record<string, unknown>;
}
interface Recommendation {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string; message: string; action: string | null; metric: string; priority: number;
  action_type?: string | null;
  action_target?: { course_id?: string; activity_id?: string } | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d: string) => new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
const fmtDuration = (s: number | null) => {
  if (!s) return "—";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); const sec = s % 60;
  return m < 60 ? `${m}m ${sec}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const scoreColor = (s: number) => s >= 70 ? "#16a34a" : s >= 40 ? "#f59e0b" : "#dc2626";
const scoreLabel = (s: number) => s >= 70 ? "Engaged" : s >= 40 ? "At Risk" : "Disengaged";
const scoreBg    = (s: number) => s >= 70 ? "bg-green-50 text-green-700 border-green-200" : s >= 40 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200";

const recColors: Record<string, { bg: string; border: string; icon: string; iconComp: typeof CheckCircle }> = {
  success: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600", iconComp: CheckCircle },
  warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", iconComp: AlertTriangle },
  danger:  { bg: "bg-red-50",   border: "border-red-200",   icon: "text-red-600",   iconComp: AlertTriangle },
  info:    { bg: "bg-clay/10",  border: "border-clay/30",  icon: "text-clay",  iconComp: Info },
};

const deviceIcon = (d: string) => d === "mobile" ? <Smartphone className="w-4 h-4" /> : d === "tablet" ? <Cpu className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;

// Maps a recommendation's structured action to an in-app route + navigation state.
function resolveRecAction(rec: Recommendation): { path: string; state?: Record<string, unknown> } | null {
  const courseId = rec.action_target?.course_id;
  const state = courseId ? { courseId } : undefined;
  switch (rec.action_type) {
    case "courses":     return { path: "/my-courses" };
    case "lessons":     return { path: "/lessons", state };
    case "assessments": return { path: "/assessments", state };
    case "forum":       return { path: "/course-forum", state };
    case "calendar":    return { path: "/calendar", state };
    case "sessions":    return { path: "/sessions", state };
    default:            return null;
  }
}

const eventTypeBadge: Record<string, string> = {
  content_view:     "bg-clay/10 text-clay",
  activity_complete:"bg-green-100 text-green-700",
  quiz_start:       "bg-clay/10 text-clay",
  quiz_submit:      "bg-clay/10 text-clay",
  forum_post:       "bg-orange-100 text-orange-700",
  forum_reply:      "bg-amber-100 text-amber-700",
};

// ── Gauge Component ───────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const r = 60; const cx = 80; const cy = 80;
  const circ = Math.PI * r;
  const offset = circ - (circ * Math.min(score, 100)) / 100;
  const color = scoreColor(score);
  return (
    <svg width="160" height="100" viewBox="0 0 160 100">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={color}
        strokeWidth="14" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{Math.round(score)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="#6b7280">/ 100</text>
    </svg>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LearnerEngagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "logs" | "ai">("overview");
  const [loading, setLoading] = useState(true);

  // Overview data
  const [scores, setScores]           = useState<CourseScore[]>([]);
  const [streak, setStreak]           = useState<Streak | null>(null);
  const [loginCount, setLoginCount]   = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [weeklyTrend, setWeeklyTrend] = useState<{ week: number; score: number }[]>([]);
  const [deviceBreak, setDeviceBreak] = useState<Record<string, number>>({});

  // Login history
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [loginPage, setLoginPage]         = useState(1);
  const [loginTotal, setLoginTotal]       = useState(0);
  const [loginLoading, setLoginLoading]   = useState(false);

  // Activity log
  const [events, setEvents]           = useState<ActivityEvent[]>([]);
  const [eventPage, setEventPage]     = useState(1);
  const [eventTotal, setEventTotal]   = useState(0);
  const [evLoading, setEvLoading]     = useState(false);
  const [evFilter, setEvFilter]       = useState("");

  // Recommendations
  const [recs, setRecs]               = useState<Recommendation[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  // Load overview on mount
  useEffect(() => {
    setLoading(true);
    engagementApi.dashboard().then(r => {
      const d = r.data;
      setScores(d.latest_scores ?? []);
      setStreak(d.streak ?? null);
      setLoginCount(d.login_count_30d ?? 0);
      setEventsCount(d.events_count_7d ?? 0);
      setWeeklyTrend(d.weekly_trend ?? []);
      setDeviceBreak(d.device_breakdown ?? {});
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadLoginHistory = useCallback((page: number) => {
    setLoginLoading(true);
    engagementApi.loginHistory(page).then(r => {
      setLoginSessions(r.data.data ?? []);
      setLoginTotal(r.data.meta?.total ?? 0);
      setLoginPage(page);
    }).catch(() => {}).finally(() => setLoginLoading(false));
  }, []);

  const loadActivityLog = useCallback((page: number, filter = "") => {
    setEvLoading(true);
    const params: Record<string, unknown> = { page, per_page: 30 };
    if (filter) params.event_type = filter;
    engagementApi.activityLog(params).then(r => {
      setEvents(r.data.data ?? []);
      setEventTotal(r.data.meta?.total ?? 0);
      setEventPage(page);
    }).catch(() => {}).finally(() => setEvLoading(false));
  }, []);

  const loadRecs = useCallback(() => {
    setRecsLoading(true);
    engagementApi.recommendations().then(r => setRecs(r.data.data ?? []))
      .catch(() => {}).finally(() => setRecsLoading(false));
  }, []);

  useEffect(() => { if (tab === "logs" && loginSessions.length === 0) loadLoginHistory(1); }, [tab]);
  useEffect(() => { if (tab === "ai"  && recs.length === 0)           loadRecs(); }, [tab]);

  // ── Radar data ──────────────────────────────────────────────────────────────
  const radarData = scores.length > 0 ? [
    { subject: "Login",      value: Math.round((scores[0].login_consistency_score   ?? 0) * 100) },
    { subject: "Content",    value: Math.round((scores[0].content_completion_score  ?? 0) * 100) },
    { subject: "Assessment", value: Math.round((scores[0].assessment_activity_score ?? 0) * 100) },
    { subject: "Forum",      value: Math.round((scores[0].forum_participation_score ?? 0) * 100) },
    { subject: "Pacing",     value: Math.round((scores[0].pacing_score              ?? 0) * 100) },
    { subject: "Live",       value: Math.round((scores[0].live_session_score        ?? 0) * 100) },
  ] : [];

  const avgScore = scores.length
    ? Math.round(scores.reduce((s, c) => s + (c.engagement_score ?? 0), 0) / scores.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-clay" /> My Engagement
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your learning behaviour, activity history, and AI-powered tips.</p>
        </div>
        {streak && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-700">{streak.current_streak_days}-day streak</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["overview", "logs", "ai"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-white shadow text-clay" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "overview" ? "Overview" : t === "logs" ? "Activity Logs" : "AI Tips"}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 text-clay animate-spin" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Avg Score</p>
                  <ScoreGauge score={avgScore} />
                  <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(avgScore)}`}>
                    {scoreLabel(avgScore)}
                  </span>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Logins (30d)</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-bold text-clay">{loginCount}</span>
                    <span className="text-gray-400 text-sm mb-1">sessions</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Consistency indicator</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Events (7d)</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-bold text-green-600">{eventsCount}</span>
                    <span className="text-gray-400 text-sm mb-1">actions</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Last 7 days activity</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-between">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Best Streak</p>
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-4xl font-bold text-amber-500">{streak?.current_streak_days ?? 0}</span>
                    <span className="text-gray-400 text-sm mb-1">days</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Longest: {streak?.longest_streak_days ?? 0}d</p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weekly trend */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-clay" /> Weekly Engagement Trend
                  </h3>
                  {weeklyTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={weeklyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} tickFormatter={w => `W${w}`} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: number) => [`${v}`, "Score"]} labelFormatter={w => `Week ${w}`} />
                        <Line type="monotone" dataKey="score" stroke="#b5613d" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No trend data yet</div>
                  )}
                </div>

                {/* Radar breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Score Breakdown
                  </h3>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart data={radarData} cx="50%" cy="50%">
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <Radar dataKey="value" stroke="#b5613d" fill="#b5613d" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No breakdown data yet</div>
                  )}
                </div>
              </div>

              {/* Per-course scores */}
              {scores.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" /> Course Scores
                  </h3>
                  <div className="space-y-3">
                    {scores.map(s => (
                      <div key={s.course_id} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 truncate">{s.course?.name ?? "Course"}</span>
                            <span className="text-sm font-bold ml-2" style={{ color: scoreColor(s.engagement_score) }}>{Math.round(s.engagement_score)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min(s.engagement_score, 100)}%`, backgroundColor: scoreColor(s.engagement_score) }} />
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(s.engagement_score)}`}>
                          {scoreLabel(s.engagement_score)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device breakdown */}
              {Object.keys(deviceBreak).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-clay" /> Device Usage (Last 30 Days)
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(deviceBreak).map(([device, count]) => (
                      <div key={device} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
                        <span className="text-gray-500">{deviceIcon(device)}</span>
                        <span className="text-sm text-gray-600 capitalize">{device}</span>
                        <span className="text-sm font-bold text-gray-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LOGS TAB ────────────────────────────────────────────────────────── */}
      {tab === "logs" && (
        <div className="space-y-5">
          {/* Login History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-clay" /> Login History
                {loginTotal > 0 && <span className="text-xs text-gray-400">({loginTotal} total)</span>}
              </h3>
              <button onClick={() => loadLoginHistory(loginPage)} className="text-gray-400 hover:text-clay-deep">
                <RefreshCw className={`w-4 h-4 ${loginLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-2.5">Date</th>
                    <th className="text-left px-5 py-2.5">Time In</th>
                    <th className="text-left px-5 py-2.5">Device</th>
                    <th className="text-left px-5 py-2.5">Duration</th>
                    <th className="text-left px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loginLoading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">Loading...</td></tr>
                  ) : loginSessions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400">No login history yet</td></tr>
                  ) : loginSessions.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-700 font-medium">{fmtDate(s.started_at)}</td>
                      <td className="px-5 py-3 text-gray-500">{fmtTime(s.started_at)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          {deviceIcon(s.device_type)}
                          <span>
                            <span className="capitalize font-medium">
                              {s.device_type === 'mobile' ? 'Phone' : s.device_type === 'tablet' ? 'Tablet' : 'Desktop'}
                            </span>
                            {s.ip_address && (
                              <span className="text-gray-400 text-xs ml-1">({s.ip_address})</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{fmtDuration(s.duration_seconds)}</td>
                      <td className="px-5 py-3">
                        {!s.ended_at ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : s.is_bounce ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Bounced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-clay/10 text-clay border border-clay/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-clay" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loginTotal > 20 && (
              <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-50">
                <button onClick={() => loadLoginHistory(loginPage - 1)} disabled={loginPage === 1}
                  className="px-3 py-1 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <span className="text-xs text-gray-400">Page {loginPage}</span>
                <button onClick={() => loadLoginHistory(loginPage + 1)} disabled={loginPage * 20 >= loginTotal}
                  className="px-3 py-1 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            )}
          </div>

          {/* Activity Event Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" /> Activity Log
                {eventTotal > 0 && <span className="text-xs text-gray-400">({eventTotal} events)</span>}
              </h3>
              <div className="flex items-center gap-2">
                <select value={evFilter} onChange={e => { setEvFilter(e.target.value); loadActivityLog(1, e.target.value); }}
                  className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 bg-white">
                  <option value="">All events</option>
                  <option value="content_view">Content View</option>
                  <option value="activity_complete">Completion</option>
                  <option value="quiz_start">Quiz Start</option>
                  <option value="quiz_submit">Quiz Submit</option>
                  <option value="forum_post">Forum Post</option>
                  <option value="forum_reply">Forum Reply</option>
                </select>
                <button onClick={() => loadActivityLog(1, evFilter)} className="text-gray-400 hover:text-green-500">
                  <RefreshCw className={`w-4 h-4 ${evLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            {events.length === 0 && !evLoading ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <button onClick={() => loadActivityLog(1)} className="flex items-center gap-1.5 mx-auto text-clay hover:underline">
                  <RefreshCw className="w-4 h-4" /> Load activity log
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {evLoading ? (
                  <div className="py-8 text-center text-gray-400">Loading...</div>
                ) : events.map(ev => (
                  <div key={ev.id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50/50">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${eventTypeBadge[ev.event_type] ?? "bg-gray-100 text-gray-600"}`}>
                        {ev.event_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        {ev.course?.name && <span className="font-medium">{ev.course.name} — </span>}
                        <span className="capitalize text-gray-500">{ev.resource_type?.replace(/_/g, " ") ?? "action"}</span>
                        {ev.value !== null && <span className="ml-1 text-gray-400 text-xs">({ev.value}%)</span>}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-400">{fmtDate(ev.occurred_at)}</p>
                      <p className="text-xs text-gray-300">{fmtTime(ev.occurred_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {eventTotal > 30 && (
              <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-50">
                <button onClick={() => loadActivityLog(eventPage - 1, evFilter)} disabled={eventPage === 1}
                  className="px-3 py-1 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50">Prev</button>
                <span className="text-xs text-gray-400">Page {eventPage}</span>
                <button onClick={() => loadActivityLog(eventPage + 1, evFilter)} disabled={eventPage * 30 >= eventTotal}
                  className="px-3 py-1 rounded-lg text-sm border disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI TIPS TAB ─────────────────────────────────────────────────────── */}
      {tab === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-clay" /> AI-Powered Recommendations
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Personalised insights based on your engagement signals.</p>
            </div>
            <button onClick={loadRecs} className="flex items-center gap-1.5 text-sm text-clay hover:underline">
              <RefreshCw className={`w-4 h-4 ${recsLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {recsLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 text-clay animate-spin" />
            </div>
          ) : recs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-semibold text-gray-700">You're all caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No recommendations right now. Keep up the great work.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.map((rec, i) => {
                const c = recColors[rec.type] ?? recColors.info;
                const Icon = c.iconComp;
                return (
                  <div key={i} className={`rounded-2xl border p-5 shadow-sm ${c.bg} ${c.border}`}>
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.icon}`} />
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${c.icon}`}>{rec.title}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{rec.message}</p>
                        {rec.action && (() => {
                          const target = resolveRecAction(rec);
                          if (!target) return null;
                          return (
                            <button
                              onClick={() => navigate(target.path, target.state ? { state: target.state } : undefined)}
                              className={`mt-3 text-xs font-semibold underline ${c.icon} hover:opacity-80`}
                            >
                              {rec.action} →
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
