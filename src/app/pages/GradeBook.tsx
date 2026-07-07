import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, ClipboardCheck, Loader2, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { gradesApi } from "../services/api";
import { useRealtime } from "../context/RealtimeContext";
import { useAiWidgetContext } from "../context/AiWidgetContext";

interface GradeRow {
  id: string;
  course_id: string | null;
  course_name: string;
  activity_id: string | null;
  activity_name: string;
  type: "quiz" | "assignment" | "practical" | "interactive";
  grade: number | null;
  grade_max: number | null;
  percentage: number | null;
  status: string | null;
  submitted_at: string | null;
  auto_submitted: boolean;
  late: boolean;
  graded: boolean;
  feedback: string | null;
}

const gradeFromProgress = (p: number) =>
  p >= 97 ? "A+" : p >= 93 ? "A" : p >= 90 ? "A-" :
  p >= 87 ? "B+" : p >= 83 ? "B" : p >= 80 ? "B-" :
  p >= 70 ? "C" : p > 0 ? "D" : "—";

const gradeColor = (g: string) =>
  g.startsWith("A") ? "#16a34a" : g.startsWith("B") ? "#b5613d" : g === "—" ? "#94a3b8" : "#f59e0b";

const TYPE_LABELS: Record<GradeRow["type"], string> = {
  quiz: "Quiz",
  assignment: "Assignment",
  practical: "Practical",
  interactive: "Interactive",
};

const TYPE_BADGE: Record<GradeRow["type"], { color: string; bg: string }> = {
  quiz:        { color: "#8c4a2f", bg: "#fdf4ff" },
  assignment:  { color: "#b5613d", bg: "#f3ece6" },
  practical:   { color: "#0891b2", bg: "#ecfeff" },
  interactive: { color: "#db2777", bg: "#fdf2f8" },
};

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export function GradeBook() {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { setContext } = useAiWidgetContext();
  const { refreshTrigger } = useRealtime();

  useEffect(() => {
    setContext({ currentPage: "/grade-book", mode: "reflection" });
  }, [setContext]);

  useEffect(() => {
    setLoading(true);
    gradesApi.gradebook()
      .then(r => {
        const data = (r.data?.data ?? r.data ?? []) as GradeRow[];
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => { if (r.course_id) map.set(r.course_id, r.course_name); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (courseFilter !== "all" && r.course_id !== courseFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (statusFilter === "graded" && !r.graded) return false;
    if (statusFilter === "pending" && r.graded) return false;
    return true;
  }), [rows, courseFilter, typeFilter, statusFilter]);

  // Overall average across graded items only.
  const gradedPercents = filtered.filter(r => r.graded && r.percentage != null).map(r => r.percentage as number);
  const overall = gradedPercents.length
    ? Math.round(gradedPercents.reduce((s, p) => s + p, 0) / gradedPercents.length)
    : 0;
  const overallLetter = gradeFromProgress(overall);

  // Group filtered rows by course for display.
  const grouped = useMemo(() => {
    const m = new Map<string, { name: string; items: GradeRow[] }>();
    filtered.forEach(r => {
      const key = r.course_id ?? "_none";
      if (!m.has(key)) m.set(key, { name: r.course_name, items: [] });
      m.get(key)!.items.push(r);
    });
    return Array.from(m.values());
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#b5613d" }} /></div>;
  }

  const selectStyle: React.CSSProperties = {
    fontSize: "13px", color: "#1e293b", padding: "7px 10px", borderRadius: "10px",
    border: "1px solid #e2e8f0", backgroundColor: "#fff", outline: "none",
  };

  const cards = [
    { label: "Overall Average", value: `${overall}%`, icon: TrendingUp, color: "#b5613d", bg: "#f3ece6", sub: undefined },
    { label: "Grade", value: overallLetter, icon: Award, color: gradeColor(overallLetter), bg: "#fdf4ff", sub: undefined },
    { label: "Graded Items", value: `${rows.filter(r => r.graded).length}`, icon: ClipboardCheck, color: "#16a34a", bg: "#f0fdf4", sub: `of ${rows.length}` },
    { label: "Courses", value: `${courses.length}`, icon: BookOpen, color: "#8c4a2f", bg: "#fdf4ff", sub: "with tasks" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Grade Book</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          All your grades across quizzes, assignments, practicals and interactive activities
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                <s.icon size={17} color={s.color} />
              </div>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</span>
            </div>
            <div className="flex items-end gap-1">
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>{s.value}</span>
              {s.sub && <span style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "3px" }}>{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Filter:</span>
        <select style={selectStyle} value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option value="all">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select style={selectStyle} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          <option value="quiz">Quizzes</option>
          <option value="assignment">Assignments</option>
          <option value="practical">Practicals</option>
          <option value="interactive">Interactive</option>
        </select>
        <select style={selectStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="graded">Graded</option>
          <option value="pending">Awaiting grade</option>
        </select>
      </div>

      {/* Grouped table */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        {grouped.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "24px" }}>No graded items match your filters.</p>
        ) : (
          <div className="space-y-6">
            {grouped.map((g, ci) => (
              <div key={ci}>
                <h2 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "10px" }}>{g.name}</h2>
                <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #f1f5f9" }}>
                  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", minWidth: "640px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
                        <th style={{ textAlign: "left",   padding: "8px 12px", fontWeight: 600 }}>Activity</th>
                        <th style={{ textAlign: "left",   padding: "8px 12px", fontWeight: 600 }}>Type</th>
                        <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 600 }}>Grade</th>
                        <th style={{ textAlign: "center", padding: "8px 12px", fontWeight: 600 }}>%</th>
                        <th style={{ textAlign: "left",   padding: "8px 12px", fontWeight: 600 }}>Status</th>
                        <th style={{ textAlign: "left",   padding: "8px 12px", fontWeight: 600 }}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((r) => {
                        const badge = TYPE_BADGE[r.type];
                        const pct = r.percentage != null ? `${Math.round(r.percentage)}%` : "—";
                        const gradeText = r.grade != null
                          ? `${r.grade}${r.grade_max ? `/${r.grade_max}` : ""}`
                          : "—";
                        return (
                          <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "8px 12px", color: "#1e293b", fontWeight: 600 }}>{r.activity_name}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 700, color: badge.color, backgroundColor: badge.bg }}>
                                {TYPE_LABELS[r.type]}
                              </span>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#334155" }}>{gradeText}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#334155" }}>{pct}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md" style={{
                                  fontSize: "10px", fontWeight: 700,
                                  color: r.graded ? "#16a34a" : "#f59e0b",
                                  backgroundColor: r.graded ? "#f0fdf4" : "#fffbeb",
                                }}>
                                  {r.graded ? "Graded" : "Awaiting grade"}
                                </span>
                                {r.auto_submitted && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", backgroundColor: "#fef2f2" }}>
                                    <AlertTriangle size={10} /> Auto-submitted
                                  </span>
                                )}
                                {r.late && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 700, color: "#ea580c", backgroundColor: "#fff7ed" }}>
                                    <Clock size={10} /> Late
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "8px 12px", color: "#64748b" }}>{fmtDate(r.submitted_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
