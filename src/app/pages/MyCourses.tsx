import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import { BookOpen, Clock, TrendingUp, CheckCircle, PlayCircle, Loader2 } from "lucide-react";
import { coursesApi } from "../services/api";

const tabs = ["All", "In Progress", "Completed", "Not Started"];

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#f59e0b", "#e11d48"];

const gradeColors: Record<string, string> = {
  "A+": "#16a34a", A: "#16a34a", "A-": "#22c55e",
  "B+": "#2563eb", B: "#3b82f6", "B-": "#60a5fa",
  "—": "#94a3b8",
};

function deriveStatus(progress: number): string {
  if (progress === 0)   return "Not Started";
  if (progress >= 100)  return "Completed";
  return "In Progress";
}

export function MyCourses() {
  const [activeTab, setActiveTab]   = useState("All");
  const [courses, setCourses]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    coursesApi.myCourses()
      .then(r => setCourses(r.data.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enriched = courses.map((c, i) => ({
    id:           String(c.id),
    code:         String(c.short_name ?? c.shortName ?? ''),
    title:        String(c.name       ?? ''),
    instructor:   String(c.instructor_name ?? c.instructor ?? ''),
    progress:     Number(c.completion_rate ?? 0),
    lessonsTotal: Number(c.total_sections   ?? 0),
    lessonsDone:  Number(c.completed_sections ?? 0),
    status:       deriveStatus(Number(c.completion_rate ?? 0)),
    color:        COLORS[i % COLORS.length],
    grade:        String(c.current_grade ?? '—'),
    lastActivity: String(c.last_accessed ?? ''),
  }));

  const filtered = activeTab === "All" ? enriched : enriched.filter((c) => c.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>My Courses</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            You are enrolled in {enriched.length} courses this semester
          </p>
        </div>
        <NavLink
          to="/catalog"
          className="px-4 py-2 rounded-xl text-white transition-all"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}
        >
          + Enroll New
        </NavLink>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Progress", count: enriched.filter(c => c.status === "In Progress").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed",   count: enriched.filter(c => c.status === "Completed").length,   color: "#22c55e", bg: "#f0fdf4" },
          { label: "Not Started", count: enriched.filter(c => c.status === "Not Started").length, color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.count}</span>
            </div>
            <span style={{ fontSize: "13px", color: "#64748b" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeTab === tab ? 600 : 400,
              backgroundColor: activeTab === tab ? "#2563eb" : "white",
              color: activeTab === tab ? "white" : "#475569",
              borderColor: activeTab === tab ? "#2563eb" : "#e2e8f0",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Courses List */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>No courses found.</p>
        </div>
      )}
      <div className="space-y-4">
        {!loading && filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="flex">
              {/* Thumbnail — colour block (no external image required) */}
              <div className="w-32 flex-shrink-0 hidden sm:flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}55)` }}>
                <span className="font-bold" style={{ fontSize: "13px", color: course.color }}>{course.code || 'COURSE'}</span>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{course.title}</h3>
                      {course.status === "Completed" && <CheckCircle size={15} color="#22c55e" />}
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{course.instructor}</p>

                    {/* Progress */}
                    <div className="mt-3 max-w-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {course.lessonsDone}/{course.lessonsTotal} lessons
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: course.color }}>
                          {course.progress}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${course.progress}%`,
                            backgroundColor: course.progress === 100 ? "#22c55e" : course.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      {course.lastActivity && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock size={11} />
                          <span style={{ fontSize: "11px" }}>{course.lastActivity}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                    <div className="text-center">
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>Grade</p>
                      <p style={{ fontSize: "18px", fontWeight: 700, color: gradeColors[course.grade] || "#1e293b" }}>
                        {course.grade}
                      </p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: course.status === "Completed" ? "#f0fdf4" : "#eff6ff",
                        color: course.status === "Completed" ? "#16a34a" : "#2563eb",
                        border: `1px solid ${course.status === "Completed" ? "#bbf7d0" : "#bfdbfe"}`,
                      }}
                    >
                      {course.status === "Not Started" ? (
                        <><PlayCircle size={13} /> Start</>
                      ) : course.status === "Completed" ? (
                        <><CheckCircle size={13} /> Review</>
                      ) : (
                        <><TrendingUp size={13} /> Continue</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
