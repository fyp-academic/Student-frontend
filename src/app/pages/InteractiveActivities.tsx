import { useState, useEffect } from "react";
import { MousePointerClick, PlayCircle, Star, Clock, CheckCircle, Code, FlaskConical, Brain, Loader2 } from "lucide-react";
import { coursesApi, activitiesApi } from "../services/api";

type Act = Record<string, unknown>;

const COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#f59e0b"];

const INTERACTIVE_TYPES = ['lab', 'resource', 'interactive', 'simulation', 'game', 'forum', 'project'];

const iconForType = (t: string) => {
  if (t.includes('lab') || t.includes('sim')) return FlaskConical;
  if (t.includes('quiz') || t.includes('ai') || t.includes('brain')) return Brain;
  return Code;
};

const typeColors: Record<string, { bg: string; text: string }> = {
  lab:         { bg: "#f0fdf4", text: "#16a34a" },
  resource:    { bg: "#eff6ff", text: "#2563eb" },
  simulation:  { bg: "#f0fdfa", text: "#0d9488" },
  interactive: { bg: "#eff6ff", text: "#2563eb" },
  game:        { bg: "#fef2f2", text: "#dc2626" },
  forum:       { bg: "#fff7ed", text: "#ea580c" },
  project:     { bg: "#fdf4ff", text: "#9333ea" },
};

type ActivityItem = { id: string; code: string; title: string; type: string; color: string; description: string; status: string; duration: string; url: string; };

export function InteractiveActivities() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cRes = await coursesApi.myCourses();
        const enrolled: Act[] = cRes.data.data ?? cRes.data ?? [];
        const all: ActivityItem[] = [];
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
                  const rawType = String(a.type ?? a.activity_type ?? '').toLowerCase();
                  if (INTERACTIVE_TYPES.some(t => rawType.includes(t))) {
                    all.push({
                      id:          String(a.id ?? ''),
                      code,
                      title:       String(a.name ?? a.title ?? 'Activity'),
                      type:        rawType || 'resource',
                      color,
                      description: String(a.description ?? a.summary ?? ''),
                      status:      String(a.status ?? 'available').toLowerCase(),
                      duration:    a.time_limit ? `${a.time_limit} min` : '',
                      url:         String(a.url ?? a.external_url ?? a.file_url ?? ''),
                    });
                  }
                });
              } catch { /* ignore */ }
            }));
          } catch { /* ignore */ }
        }));
        setActivities(all);
      } catch { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const completed = activities.filter(a => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Interactive Activities</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Simulations, virtual labs, and gamified learning experiences
        </p>
      </div>

      {/* Banner */}
      <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #059669, #16a34a)", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}>
        <div>
          <p style={{ fontSize: "13px", color: "#d1fae5" }}>Your Progress</p>
          <p className="text-white" style={{ fontSize: "18px", fontWeight: 700 }}>
            {loading ? '…' : `${completed}/${activities.length} Activities Completed`}
          </p>
          <p style={{ fontSize: "13px", color: "#d1fae5", marginTop: "2px" }}>Keep going to unlock bonus content!</p>
        </div>
        <div className="text-center">
          <p className="text-white" style={{ fontSize: "32px", fontWeight: 700 }}>⚡</p>
          <p className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>{completed} done</p>
          <p style={{ fontSize: "11px", color: "#d1fae5" }}>Completed</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available",  value: loading ? '…' : activities.filter(a => a.status !== 'completed').length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed",  value: loading ? '…' : completed,          color: "#22c55e", bg: "#f0fdf4" },
          { label: "Total",      value: loading ? '…' : activities.length,   color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: "#059669" }} /></div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <FlaskConical size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No interactive activities found in your enrolled courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((activity) => {
            const Icon      = iconForType(activity.type);
            const tCfg      = typeColors[activity.type] ?? { bg: "#f1f5f9", text: "#475569" };
            const isDone    = activity.status === 'completed';
            const hasUrl    = !!activity.url;
            return (
              <div key={activity.id} className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-1" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${activity.color}15` }}>
                    <Icon size={22} color={activity.color} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {activity.code && <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: activity.color }}>{activity.code}</span>}
                      <span className="px-2 py-0.5 rounded-md capitalize" style={{ fontSize: "10px", fontWeight: 600, backgroundColor: tCfg.bg, color: tCfg.text }}>{activity.type}</span>
                    </div>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{activity.title}</h3>
                    {activity.description && <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginTop: "4px" }}>{activity.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-slate-400" style={{ fontSize: "11px" }}>
                      {activity.duration && <div className="flex items-center gap-1"><Clock size={10} />{activity.duration}</div>}
                      {hasUrl && <div className="flex items-center gap-1"><Star size={10} color="#f59e0b" fill="#f59e0b" />External</div>}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                      {isDone ? (
                        <span className="flex items-center gap-1 text-green-600" style={{ fontSize: "11px", fontWeight: 600 }}><CheckCircle size={12} /> Completed</span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Ready to start</span>
                      )}
                      <button
                        onClick={() => { if (activity.url) window.open(activity.url, '_blank'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white transition-all"
                        style={{ fontSize: "12px", fontWeight: 600, backgroundColor: isDone ? "#94a3b8" : activity.color }}
                      >
                        {isDone ? <><MousePointerClick size={12} /> Revisit</> : <><PlayCircle size={12} /> Launch</>}
                      </button>
                    </div>
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
