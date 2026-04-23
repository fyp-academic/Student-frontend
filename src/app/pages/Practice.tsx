import { useState, useEffect } from "react";
import { Target, PlayCircle, RotateCcw, Zap, Star, Clock, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { coursesApi, activitiesApi, quizApi } from "../services/api";

type DrillItem   = Record<string, unknown>;
type CategoryItem = { id: string; title: string; code: string; color: string; drills: DrillItem[] };

const COLORS = ["#2563eb","#7c3aed","#0891b2","#059669","#dc2626","#f59e0b"];

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  easy:   { color: "#16a34a", bg: "#f0fdf4" },
  medium: { color: "#d97706", bg: "#fffbeb" },
  hard:   { color: "#dc2626", bg: "#fef2f2" },
};

const getScoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 75 ? "#2563eb" : "#f59e0b";

export function Practice() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [categories, setCategories]         = useState<CategoryItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [attemptMap, setAttemptMap]         = useState<Record<string, DrillItem>>({}); // activityId → best attempt

  useEffect(() => {
    (async () => {
      try {
        const cRes = await coursesApi.myCourses();
        const enrolled: DrillItem[] = cRes.data.data ?? cRes.data ?? [];

        const built: CategoryItem[] = [];
        await Promise.all(enrolled.map(async (course, ci) => {
          const cid   = String(course.id ?? ci);
          const title = String(course.title ?? course.name ?? '');
          const code  = String(course.short_name ?? course.shortName ?? course.code ?? '');
          const color = COLORS[ci % COLORS.length];

          const sRes = await coursesApi.sections(cid);
          const sections: DrillItem[] = sRes.data.data ?? sRes.data ?? [];
          const drills: DrillItem[] = [];

          await Promise.all(sections.map(async (sec) => {
            const secId = String(sec.id ?? '');
            if (!secId) return;
            const aRes = await activitiesApi.list(secId);
            const acts: DrillItem[] = aRes.data.data ?? aRes.data ?? [];
            const quizzes = acts.filter(a => {
              const t = String(a.type ?? a.activity_type ?? '').toLowerCase();
              return t.includes('quiz') || t.includes('practice');
            });
            drills.push(...quizzes);
          }));

          if (drills.length > 0) {
            built.push({ id: cid, title, code, color, drills });
          }
        }));

        setCategories(built);

        // Load quiz attempts to get best scores
        try {
          const qRes = await quizApi.myAttempts();
          const attempts: DrillItem[] = qRes.data.data ?? qRes.data ?? [];
          const map: Record<string, DrillItem> = {};
          attempts.forEach(a => {
            const aid = String(a.activity_id ?? a.quiz_id ?? '');
            if (!map[aid] || Number(a.score ?? 0) > Number((map[aid] as DrillItem).score ?? 0)) {
              map[aid] = a;
            }
          });
          setAttemptMap(map);
        } catch { /* ignore */ }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const category = categories[activeCategory];

  const allDrills  = categories.flatMap(c => c.drills);
  const allScores  = allDrills.map(d => attemptMap[String(d.id ?? '')]).filter(Boolean);
  const mastered   = allScores.filter(a => Number(a.score ?? 0) >= 90).length;
  const totalAttempts = allScores.length;

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Practice</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Sharpen your skills with targeted practice drills</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Attempts",  value: totalAttempts, icon: Target, color: "#2563eb", bg: "#eff6ff" },
          { label: "Drills Mastered", value: mastered,      icon: Star,   color: "#22c55e", bg: "#f0fdf4" },
          { label: "Courses",         value: categories.length, icon: Zap, color: "#f59e0b", bg: "#fffbeb" },
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

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <Target size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No practice drills found in your enrolled courses.</p>
        </div>
      ) : (
        <>
          {/* Course Tabs */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat, idx) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(idx)}
                className="px-4 py-2 rounded-xl border transition-all"
                style={{ fontSize: "12px", fontWeight: activeCategory === idx ? 600 : 400,
                  backgroundColor: activeCategory === idx ? cat.color : "white",
                  color: activeCategory === idx ? "white" : "#475569",
                  borderColor: activeCategory === idx ? cat.color : "#e2e8f0" }}
              >
                {cat.code && `${cat.code} — `}{cat.title}
              </button>
            ))}
          </div>

          {category && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}18` }}>
                  <Target size={16} color={category.color} />
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.drills.map((drill, di) => {
                  const did        = String(drill.id ?? di);
                  const title      = String(drill.name ?? drill.title ?? `Drill ${di + 1}`);
                  const qCount     = Number(drill.questions_count ?? drill.questions ?? 0);
                  const timeLimit  = Number(drill.time_limit ?? drill.timeLimit ?? 0);
                  const diffLevel  = String(drill.difficulty ?? drill.level ?? 'medium').toLowerCase();
                  const diffCfg    = difficultyConfig[diffLevel] ?? difficultyConfig.medium;
                  const attempt    = attemptMap[did];
                  const bestScore  = attempt ? Number(attempt.score ?? 0) : null;
                  const attempts   = attempt ? 1 : 0;

                  return (
                    <div key={did} className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md capitalize" style={{ fontSize: "10px", fontWeight: 600, ...diffCfg }}>{diffLevel}</span>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 3 }).map((_, i) => {
                                const stars = diffLevel === 'easy' ? 1 : diffLevel === 'medium' ? 2 : 3;
                                return <Star key={i} size={10} color={i < stars ? "#f59e0b" : "#e2e8f0"} fill={i < stars ? "#f59e0b" : "#e2e8f0"} />;
                              })}
                            </div>
                          </div>
                        </div>
                        {bestScore !== null && (
                          <div className="text-right">
                            <p style={{ fontSize: "20px", fontWeight: 700, color: getScoreColor(bestScore) }}>{bestScore}%</p>
                            <p style={{ fontSize: "10px", color: "#94a3b8" }}>Best</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-slate-400" style={{ fontSize: "11px" }}>
                        {qCount > 0 && <div className="flex items-center gap-1"><Target size={11} />{qCount} questions</div>}
                        {timeLimit > 0 && <div className="flex items-center gap-1"><Clock size={11} />{timeLimit} min</div>}
                        <div className="flex items-center gap-1"><RotateCcw size={11} />{attempts} attempt{attempts !== 1 ? 's' : ''}</div>
                      </div>

                      {bestScore !== null && (
                        <div className="mb-3">
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                            <div className="h-full rounded-full" style={{ width: `${bestScore}%`, backgroundColor: getScoreColor(bestScore) }} />
                          </div>
                          {bestScore >= 90 && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <CheckCircle size={11} color="#22c55e" />
                              <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 600 }}>Mastered!</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white transition-all"
                          style={{ fontSize: "12px", fontWeight: 600, backgroundColor: category.color }}
                          onClick={async () => {
                            try { await quizApi.start(did); } catch { /* ignore */ }
                          }}
                        >
                          <PlayCircle size={13} />
                          {attempts > 0 ? "Practice Again" : "Start Drill"}
                        </button>
                        {attempts > 0 && (
                          <button className="flex items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:bg-slate-50" style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}>
                            <TrendingUp size={13} /> Stats
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
