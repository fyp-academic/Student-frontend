import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { TrendingUp, Award, Clock, CheckCircle, BookOpen, Target } from "lucide-react";

const courseProgress = [
  { id: 1, code: "CS301", name: "Data Science Fundamentals", progress: 72, grade: "A-", gradeNum: 90, lessons: 30, total: 42, assignments: 5, assignmentsDone: 4, quizzes: 6, quizzesDone: 5, color: "#2563eb" },
  { id: 2, code: "MATH402", name: "Advanced Calculus", progress: 45, grade: "B+", gradeNum: 87, lessons: 22, total: 50, assignments: 4, assignmentsDone: 2, quizzes: 8, quizzesDone: 4, color: "#7c3aed" },
  { id: 3, code: "BIO301", name: "Molecular Biology", progress: 88, grade: "A", gradeNum: 94, lessons: 32, total: 36, assignments: 6, assignmentsDone: 6, quizzes: 5, quizzesDone: 5, color: "#059669" },
  { id: 4, code: "CS450", name: "AI & Machine Learning", progress: 23, grade: "B", gradeNum: 83, lessons: 12, total: 54, assignments: 3, assignmentsDone: 1, quizzes: 4, quizzesDone: 2, color: "#0891b2" },
  { id: 5, code: "CS201", name: "Web Development", progress: 100, grade: "A+", gradeNum: 98, lessons: 38, total: 38, assignments: 5, assignmentsDone: 5, quizzes: 5, quizzesDone: 5, color: "#22c55e" },
  { id: 6, code: "CS350", name: "Database Systems", progress: 0, grade: "—", gradeNum: 0, lessons: 0, total: 40, assignments: 0, assignmentsDone: 0, quizzes: 0, quizzesDone: 0, color: "#f59e0b" },
];

const radialData = courseProgress.slice(0, 5).map((c) => ({
  name: c.code, value: c.progress, fill: c.color,
}));

const gradeData = courseProgress.filter((c) => c.gradeNum > 0).map((c) => ({
  name: c.code, grade: c.gradeNum,
}));

const monthlyData = [
  { month: "Sep", lessons: 8, assignments: 3 },
  { month: "Oct", lessons: 15, assignments: 5 },
  { month: "Nov", lessons: 12, assignments: 4 },
  { month: "Dec", lessons: 18, assignments: 6 },
  { month: "Jan", lessons: 14, assignments: 4 },
  { month: "Feb", lessons: 20, assignments: 7 },
];

const gradeColors: Record<string, string> = {
  "A+": "#16a34a", A: "#16a34a", "A-": "#22c55e",
  "B+": "#2563eb", B: "#3b82f6", "—": "#94a3b8",
};

export function CourseProgress() {
  const overallProgress = Math.round(courseProgress.reduce((sum, c) => sum + c.progress, 0) / courseProgress.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Course Progress</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Track your academic performance and completion rates
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Progress", value: `${overallProgress}%`, icon: TrendingUp, color: "#2563eb", bg: "#eff6ff" },
          { label: "Lessons Done", value: "134", sub: "/ 260 total", icon: BookOpen, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Assignments", value: "18", sub: "/ 23 done", icon: CheckCircle, color: "#059669", bg: "#f0fdf4" },
          { label: "Avg. Grade", value: "3.85", sub: "GPA", icon: Award, color: "#7c3aed", bg: "#fdf4ff" },
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Grade Comparison */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Grade by Course</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gradeData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                formatter={(v) => [`${v}%`, "Grade"]}
              />
              <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                {gradeData.map((entry, index) => (
                  <Cell key={index} fill={courseProgress.find((c) => c.code === entry.name)?.color || "#2563eb"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Monthly Activity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="lessons" name="Lessons" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="assignments" name="Assignments" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-Course Progress */}
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Detailed Course Breakdown</h2>
        <div className="space-y-5">
          {courseProgress.map((course) => (
            <div key={course.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-0.5 rounded-md text-white"
                    style={{ fontSize: "10px", fontWeight: 700, backgroundColor: course.color }}
                  >
                    {course.code}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{course.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-slate-500 hidden md:flex" style={{ fontSize: "11px" }}>
                    <span className="flex items-center gap-1">
                      <BookOpen size={10} />
                      {course.lessons}/{course.total} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Target size={10} />
                      {course.assignmentsDone}/{course.assignments} assignments
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {course.quizzesDone}/{course.quizzes} quizzes
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: gradeColors[course.grade] || "#94a3b8",
                      minWidth: "36px",
                      textAlign: "right",
                    }}
                  >
                    {course.grade}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: course.color, minWidth: "40px", textAlign: "right" }}>
                    {course.progress}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}