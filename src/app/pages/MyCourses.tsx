import { useState } from "react";
import { NavLink } from "react-router";
import { BookOpen, Clock, ChevronRight, TrendingUp, CheckCircle, PlayCircle } from "lucide-react";

const tabs = ["All", "In Progress", "Completed", "Not Started"];

const myCourses = [
  {
    id: 1, code: "CS301", title: "Data Science Fundamentals", instructor: "Adelfina Mambali",
    progress: 72, lessonsTotal: 42, lessonsDone: 30, status: "In Progress",
    image: "https://images.unsplash.com/photo-1617240016072-d92174e44171?w=400&h=200&fit=crop",
    color: "#2563eb", nextLesson: "Neural Networks Basics", dueDate: "Apr 30, 2026",
    grade: "A-", lastActivity: "2 hours ago",
  },
  {
    id: 2, code: "MATH402", title: "Advanced Calculus", instructor: "Prof. John Miller",
    progress: 45, lessonsTotal: 50, lessonsDone: 22, status: "In Progress",
    image: "https://images.unsplash.com/photo-1732304719443-c3c04003bf25?w=400&h=200&fit=crop",
    color: "#7c3aed", nextLesson: "Multivariable Integration", dueDate: "May 15, 2026",
    grade: "B+", lastActivity: "1 day ago",
  },
  {
    id: 3, code: "BIO301", title: "Molecular Biology", instructor: "Dr. Emily Ross",
    progress: 88, lessonsTotal: 36, lessonsDone: 32, status: "In Progress",
    image: "https://images.unsplash.com/photo-1634872554756-18534b7ffe30?w=400&h=200&fit=crop",
    color: "#059669", nextLesson: "Cell Signaling Pathways", dueDate: "Apr 10, 2026",
    grade: "A", lastActivity: "3 hours ago",
  },
  {
    id: 4, code: "CS450", title: "AI & Machine Learning", instructor: "Dr. James Liu",
    progress: 23, lessonsTotal: 54, lessonsDone: 12, status: "In Progress",
    image: "https://images.unsplash.com/photo-1749006590639-e749e6b7d84c?w=400&h=200&fit=crop",
    color: "#0891b2", nextLesson: "Supervised Learning Models", dueDate: "May 20, 2026",
    grade: "B", lastActivity: "2 days ago",
  },
  {
    id: 5, code: "CS201", title: "Web Development", instructor: "Prof. Maria Santos",
    progress: 100, lessonsTotal: 38, lessonsDone: 38, status: "Completed",
    image: "https://images.unsplash.com/photo-1762329388386-22bf162a9368?w=400&h=200&fit=crop",
    color: "#22c55e", nextLesson: "—", dueDate: "Completed Jan 2026",
    grade: "A+", lastActivity: "3 weeks ago",
  },
  {
    id: 6, code: "CS350", title: "Database Systems", instructor: "Dr. Robert Kim",
    progress: 0, lessonsTotal: 40, lessonsDone: 0, status: "Not Started",
    image: "https://images.unsplash.com/photo-1763615834709-cd4b196980db?w=400&h=200&fit=crop",
    color: "#f59e0b", nextLesson: "Start: Intro to SQL", dueDate: "Jun 1, 2026",
    grade: "—", lastActivity: "Not started",
  },
];

const gradeColors: Record<string, string> = {
  "A+": "#16a34a", A: "#16a34a", "A-": "#22c55e",
  "B+": "#2563eb", B: "#3b82f6", "B-": "#60a5fa",
  "—": "#94a3b8",
};

export function MyCourses() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All" ? myCourses : myCourses.filter((c) => c.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>My Courses</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            You are enrolled in {myCourses.length} courses this semester
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
          { label: "In Progress", count: myCourses.filter(c => c.status === "In Progress").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed", count: myCourses.filter(c => c.status === "Completed").length, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Not Started", count: myCourses.filter(c => c.status === "Not Started").length, color: "#f59e0b", bg: "#fffbeb" },
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
      <div className="space-y-4">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="flex">
              {/* Thumbnail */}
              <div className="w-40 h-28 flex-shrink-0 relative overflow-hidden hidden sm:block">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${course.color}99, transparent)` }} />
                <span className="absolute top-2 left-2 text-white px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: course.color }}>
                  {course.code}
                </span>
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
                      <div className="flex items-center gap-1 text-slate-400">
                        <BookOpen size={11} />
                        <span style={{ fontSize: "11px" }}>Next: {course.nextLesson}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={11} />
                        <span style={{ fontSize: "11px" }}>{course.lastActivity}</span>
                      </div>
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
