import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle, Clock, Star, Lock, Loader2 } from "lucide-react";
import { useRealtime } from "../context/RealtimeContext";
import { coursesApi, activitiesApi } from "../services/api";

type Act = Record<string, unknown>;

const COLORS = ["#b5613d","#8c4a2f","#059669","#0891b2","#dc2626","#f59e0b"];

const typeColors: Record<string, { bg: string; text: string }> = {
  lab:         { bg: "#f3ece6",  text: "#b5613d" },
  assignment:  { bg: "#fdf4ff",  text: "#9333ea" },
  quiz:        { bg: "#f0fdfa",  text: "#0d9488" },
  forum:       { bg: "#fefce8",  text: "#ca8a04" },
  resource:    { bg: "#f0fdf4",  text: "#16a34a" },
  project:     { bg: "#fff7ed",  text: "#ea580c" },
  video:       { bg: "#f3ece6",  text: "#b5613d" },
  lesson:      { bg: "#f3ece6",  text: "#b5613d" },
  url:         { bg: "#ecfeff",  text: "#06b6d4" },
  file:        { bg: "#f8fafc",  text: "#64748b" },
  h5p:         { bg: "#fef2f2",  text: "#dc2626" },
  scorm:       { bg: "#fefce8",  text: "#ca8a04" },
  workshop:    { bg: "#fdf4ff",  text: "#9333ea" },
  label:       { bg: "#f8fafc",  text: "#94a3b8" },
  page:        { bg: "#f3ece6",  text: "#b5613d" },
  attendance:      { bg: "#f3ece6",  text: "#b5613d" },
  bigbluebutton:   { bg: "#f3ece6",  text: "#b5613d" },
  book:            { bg: "#f3ece6",  text: "#b5613d" },
  checklist:       { bg: "#f0fdf4",  text: "#16a34a" },
  choice:          { bg: "#fdf4ff",  text: "#9333ea" },
  certificate:     { bg: "#fff7ed",  text: "#ea580c" },
  database:        { bg: "#f8fafc",  text: "#64748b" },
  feedback:        { bg: "#f0fdff",  text: "#0891b2" },
  folder:          { bg: "#f8fafc",  text: "#64748b" },
  glossary:        { bg: "#f3ece6",  text: "#b5613d" },
  ims_content_package: { bg: "#fefce8", text: "#ca8a04" },
};

export function Activities() {
  const [activities, setActivities] = useState<Act[]>([]);
  const [loading, setLoading]       = useState(true);
  const { refreshTrigger } = useRealtime();

  useEffect(() => {
    setLoading(true);
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
                acts.forEach(a => all.push({ ...a, _code: code, _color: color }));
              } catch { /* ignore */ }
            }));
          } catch { /* ignore */ }
        }));
        setActivities(all);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, [refreshTrigger]);

  const done      = activities.filter(a => String(a.completion_status ?? a.status ?? '').toLowerCase() === 'completed').length;
  const available = activities.filter(a => { const s = String(a.completion_status ?? a.status ?? '').toLowerCase(); return s !== 'completed' && s !== 'locked'; }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Activities</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Labs, peer reviews, group activities, and more</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available",  value: loading ? '…' : available, color: "#b5613d", bg: "#f3ece6" },
          { label: "Completed",  value: loading ? '…' : done,      color: "#22c55e", bg: "#f0fdf4" },
          { label: "Total",      value: loading ? '…' : activities.length, color: "#8c4a2f", bg: "#fdf4ff" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: "#b5613d" }} /></div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No activities found in your enrolled courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity, ai) => {
            const aid      = String(activity.id ?? ai);
            const title    = String(activity.name ?? activity.title ?? `Activity ${ai + 1}`);
            const rawType  = String(activity.type ?? activity.activity_type ?? 'resource').toLowerCase();
            const typeCfg  = typeColors[rawType] ?? { bg: "#f1f5f9", text: "#475569" };
            const rawStatus = String(activity.completion_status ?? activity.status ?? 'available').toLowerCase();
            const isLocked  = rawStatus === 'locked';
            const isDone    = rawStatus === 'completed';
            const desc      = String(activity.description ?? activity.summary ?? '');
            const duration  = activity.time_limit ? `${activity.time_limit} min` : '';
            const dueDate   = activity.due_date ? new Date(String(activity.due_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            const points    = Number(activity.points ?? activity.max_score ?? 0);
            const code      = String(activity._code ?? '');
            const color     = String(activity._color ?? '#b5613d');

            return (
              <div key={aid} className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", opacity: isLocked ? 0.6 : 1 }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {code && <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: color }}>{code}</span>}
                      <span className="px-2 py-0.5 rounded-md capitalize" style={{ fontSize: "10px", fontWeight: 600, ...typeCfg }}>{rawType}</span>
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{title}</h3>
                  </div>
                  {isLocked ? <Lock size={18} color="#94a3b8" /> : isDone ? (
                    <div className="flex items-center gap-1"><Star size={14} color="#f59e0b" fill="#f59e0b" /><span style={{ fontSize: "18px", fontWeight: 700, color: "#16a34a" }}>✓</span></div>
                  ) : null}
                </div>

                {desc && <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginBottom: "12px" }}>{desc}</p>}

                <div className="flex items-center gap-3 mb-3 text-slate-400" style={{ fontSize: "11px" }}>
                  {duration && <div className="flex items-center gap-1"><Clock size={11} />{duration}</div>}
                  {points > 0 && <div className="flex items-center gap-1"><Star size={11} />{points} pts</div>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <span style={{ fontSize: "11px", color: isLocked ? "#94a3b8" : isDone ? "#94a3b8" : "#f59e0b", fontWeight: isDone || isLocked ? 400 : 600 }}>
                    {isLocked ? "🔒 Locked" : isDone ? `✓ Completed${dueDate ? ` · ${dueDate}` : ''}` : dueDate ? `Due: ${dueDate}` : 'Available'}
                  </span>
                  {!isLocked && !isDone && (
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white" style={{ fontSize: "12px", fontWeight: 600, backgroundColor: color }}>
                      <PlayCircle size={13} /> Start
                    </button>
                  )}
                  {isDone && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                      <CheckCircle size={12} /> Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
