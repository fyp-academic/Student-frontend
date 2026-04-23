import { useState, useEffect } from "react";
import { ClipboardList, Calendar, Clock, CheckCircle, AlertCircle, Trophy, Star, Loader2 } from "lucide-react";
import { coursesApi, activitiesApi } from "../services/api";

type Act = Record<string, unknown>;

const COLORS = ["#2563eb","#7c3aed","#059669","#0891b2","#dc2626","#f59e0b"];
const ASSESSMENT_TYPES = ['quiz', 'assignment', 'exam', 'assessment', 'midterm', 'final', 'test'];

const statusCfg = {
  upcoming:  { label: "Upcoming",  color: "#f59e0b", bg: "#fffbeb", icon: AlertCircle },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "#2563eb", bg: "#eff6ff", icon: Calendar },
  available: { label: "Available", color: "#f59e0b", bg: "#fffbeb", icon: AlertCircle },
};

export function Assessments() {
  const [assessments, setAssessments] = useState<Act[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cRes = await coursesApi.myCourses();
        const enrolled: Act[] = cRes.data.data ?? cRes.data ?? [];
        const all: Act[] = [];
        await Promise.all(enrolled.map(async (e, ci) => {
          const course = (e.course ?? e) as Act;
          const cid    = String(course.id ?? ci);
          const code   = String(course.short_name ?? course.shortName ?? course.code ?? '');
          const color  = COLORS[ci % COLORS.length];
          try {
            const sRes = await coursesApi.sections(cid);
            const secs: Act[] = sRes.data.data ?? sRes.data ?? [];
            await Promise.all(secs.map(async sec => {
              const secId = String(sec.id ?? '');
              if (!secId) return;
              try {
                const aRes = await activitiesApi.list(secId);
                const acts: Act[] = aRes.data.data ?? aRes.data ?? [];
                acts.forEach(a => {
                  const t = String(a.type ?? a.activity_type ?? '').toLowerCase();
                  if (ASSESSMENT_TYPES.some(at => t.includes(at))) {
                    all.push({ ...a, _code: code, _color: color });
                  }
                });
              } catch { /* ignore */ }
            }));
          } catch { /* ignore */ }
        }));
        setAssessments(all);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const upcoming  = assessments.filter(a => String(a.status ?? '').toLowerCase() !== 'completed').length;
  const completed = assessments.filter(a => String(a.status ?? '').toLowerCase() === 'completed').length;
  const scores    = assessments.filter(a => a.score != null).map(a => Number(a.score ?? 0));
  const avgScore  = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Assessments</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Quizzes, assignments, and formal assessments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming",   value: loading ? '…' : upcoming,                        icon: Calendar,     color: "#f59e0b", bg: "#fffbeb" },
          { label: "Completed",  value: loading ? '…' : completed,                       icon: CheckCircle,  color: "#22c55e", bg: "#f0fdf4" },
          { label: "Avg. Score", value: loading ? '…' : avgScore !== null ? `${avgScore}%` : '—', icon: Trophy, color: "#2563eb", bg: "#eff6ff" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>{s.value}</p>
              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: "#2563eb" }} /></div>
      ) : assessments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <ClipboardList size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No assessments found in your enrolled courses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((item, ii) => {
            const id        = String(item.id ?? ii);
            const title     = String(item.name ?? item.title ?? `Assessment ${ii + 1}`);
            const rawType   = String(item.type ?? item.activity_type ?? 'quiz').toLowerCase();
            const rawStatus = String(item.status ?? 'available').toLowerCase();
            const isDone    = rawStatus === 'completed';
            const statKey   = isDone ? 'completed' : rawStatus === 'scheduled' ? 'scheduled' : 'upcoming';
            const stat      = statusCfg[statKey as keyof typeof statusCfg] ?? statusCfg.upcoming;
            const StatusIcon = stat.icon;
            const code      = String(item._code ?? '');
            const color     = String(item._color ?? '#2563eb');
            const dueDate   = item.due_date ? new Date(String(item.due_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const duration  = item.time_limit ? `${item.time_limit} min` : '';
            const maxScore  = Number(item.max_score ?? item.points ?? 0);
            const earned    = item.score != null ? Number(item.score) : null;
            const desc      = String(item.description ?? item.summary ?? '');

            return (
              <div key={id} className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <ClipboardList size={22} color={color} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {code && <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: color }}>{code}</span>}
                        <span className="px-2 py-0.5 rounded-md capitalize" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: `${color}15`, color }}>{rawType}</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 600, backgroundColor: stat.bg, color: stat.color }}>
                          <StatusIcon size={10} />{stat.label}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>{title}</h3>
                      {desc && <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>{desc}</p>}
                      <div className="flex flex-wrap items-center gap-4 text-slate-400" style={{ fontSize: "11px" }}>
                        {dueDate && <div className="flex items-center gap-1"><Calendar size={11} />Due: {dueDate}</div>}
                        {duration && <div className="flex items-center gap-1"><Clock size={11} />{duration}</div>}
                        {maxScore > 0 && <span>{maxScore} pts</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:flex-col md:items-end">
                    {earned !== null ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star size={14} color="#f59e0b" fill="#f59e0b" />
                          <span style={{ fontSize: "22px", fontWeight: 700, color: "#16a34a" }}>{earned}</span>
                          {maxScore > 0 && <span style={{ fontSize: "13px", color: "#94a3b8" }}>/{maxScore}</span>}
                        </div>
                        {maxScore > 0 && <p style={{ fontSize: "11px", color: "#94a3b8" }}>{Math.round((earned / maxScore) * 100)}%</p>}
                      </div>
                    ) : maxScore > 0 ? (
                      <div className="text-right"><p style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{maxScore} pts</p></div>
                    ) : null}
                    {!isDone && (
                      <button className="px-4 py-2 rounded-xl text-white transition-all" style={{ fontSize: "12px", fontWeight: 600, backgroundColor: color }}>
                        {rawType.includes('quiz') ? 'Start Quiz' : 'Open'}
                      </button>
                    )}
                    {isDone && (
                      <button className="px-4 py-2 rounded-xl border transition-all hover:bg-slate-50" style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}>
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
