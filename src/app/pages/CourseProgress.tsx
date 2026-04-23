import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { TrendingUp, Award, BookOpen, Target, Loader2 } from "lucide-react";
import { dashboardApi } from "../services/api";

type EnrollRow = Record<string, unknown>;

const COLORS = ["#2563eb","#7c3aed","#059669","#0891b2","#22c55e","#f59e0b","#dc2626"];

const gradeFromProgress = (p: number) =>
  p >= 97 ? "A+" : p >= 93 ? "A" : p >= 90 ? "A-" :
  p >= 87 ? "B+" : p >= 83 ? "B" : p >= 80 ? "B-" :
  p >= 70 ? "C" : p > 0 ? "D" : "—";

const gradeColor = (g: string) =>
  g.startsWith("A") ? "#16a34a" : g.startsWith("B") ? "#2563eb" : g === "—" ? "#94a3b8" : "#f59e0b";

export function CourseProgress() {
  const [enrollments, setEnrollments] = useState<EnrollRow[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    dashboardApi.studentHub().then(r => {
      const data = r.data ?? {};
      const rows: EnrollRow[] = data.enrolled_courses ?? data.data?.enrolled_courses ?? [];
      setEnrollments(rows);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  const courseProgress = enrollments.map((e, i) => {
    const course   = (e.course ?? e) as Record<string, unknown>;
    const progress = Math.round(Number(e.progress ?? course.progress ?? 0));
    return {
      id:    String(course.id ?? i),
      code:  String(course.short_name ?? course.shortName ?? course.code ?? ''),
      name:  String(course.title ?? course.name ?? `Course ${i + 1}`),
      progress,
      grade: gradeFromProgress(progress),
      gradeNum: progress,
      color: COLORS[i % COLORS.length],
    };
  });

  const overallProgress = courseProgress.length
    ? Math.round(courseProgress.reduce((s, c) => s + c.progress, 0) / courseProgress.length)
    : 0;

  const gradeData = courseProgress.filter(c => c.gradeNum > 0).map(c => ({
    name: c.code || c.name.slice(0, 8),
    grade: c.gradeNum,
    color: c.color,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Course Progress</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Track your academic performance and completion rates</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Progress",  value: `${overallProgress}%`,        icon: TrendingUp, color: "#2563eb", bg: "#eff6ff", sub: undefined },
          { label: "Enrolled Courses",  value: `${courseProgress.length}`,   icon: BookOpen,   color: "#22c55e", bg: "#f0fdf4", sub: "courses" },
          { label: "Completed",          value: `${courseProgress.filter(c => c.progress >= 100).length}`, icon: Target, color: "#059669", bg: "#f0fdf4", sub: "100%" },
          { label: "Avg. Progress",      value: `${overallProgress}%`,        icon: Award,      color: "#7c3aed", bg: "#fdf4ff", sub: undefined },
        ].map((s) => (
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

      {/* Grade Chart */}
      {gradeData.length > 0 && (
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Progress by Course</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                formatter={(v) => [`${v}%`, "Progress"]}
              />
              <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                {gradeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-Course Breakdown */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Detailed Course Breakdown</h2>
        {courseProgress.length === 0 ? (
          <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "24px" }}>No enrolled courses found.</p>
        ) : (
          <div className="space-y-5">
            {courseProgress.map((course) => {
              const grade = course.grade;
              return (
                <div key={course.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {course.code && (
                        <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: course.color }}>
                          {course.code}
                        </span>
                      )}
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{course.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ fontSize: "15px", fontWeight: 700, color: gradeColor(grade), minWidth: "36px", textAlign: "right" }}>{grade}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: course.color, minWidth: "40px", textAlign: "right" }}>{course.progress}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}