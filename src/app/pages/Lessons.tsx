import { useState } from "react";
import { PlayCircle, Lock, CheckCircle, Clock, BookMarked, ChevronDown, ChevronRight } from "lucide-react";

const courses = ["CS301 - Data Science", "MATH402 - Calculus", "BIO301 - Biology", "CS450 - AI & ML"];

const lessonModules = [
  {
    id: 1, title: "Module 1: Introduction to Data Science", completed: true,
    lessons: [
      { id: 1, title: "What is Data Science?", duration: "18 min", status: "completed", type: "video" },
      { id: 2, title: "Data Science Workflow", duration: "22 min", status: "completed", type: "video" },
      { id: 3, title: "Python for Data Science Setup", duration: "30 min", status: "completed", type: "lab" },
      { id: 4, title: "Overview Quiz", duration: "10 min", status: "completed", type: "quiz" },
    ],
  },
  {
    id: 2, title: "Module 2: Data Wrangling with Pandas", completed: true,
    lessons: [
      { id: 5, title: "Introduction to Pandas", duration: "25 min", status: "completed", type: "video" },
      { id: 6, title: "DataFrames & Series", duration: "30 min", status: "completed", type: "video" },
      { id: 7, title: "Data Cleaning Techniques", duration: "35 min", status: "completed", type: "video" },
      { id: 8, title: "Hands-on: Cleaning Real Data", duration: "45 min", status: "completed", type: "lab" },
    ],
  },
  {
    id: 3, title: "Module 3: Data Visualization", completed: false,
    lessons: [
      { id: 9, title: "Matplotlib Fundamentals", duration: "28 min", status: "completed", type: "video" },
      { id: 10, title: "Seaborn for Statistical Plots", duration: "32 min", status: "completed", type: "video" },
      { id: 11, title: "Interactive Plots with Plotly", duration: "40 min", status: "in-progress", type: "video" },
      { id: 12, title: "Visualization Project", duration: "60 min", status: "locked", type: "project" },
    ],
  },
  {
    id: 4, title: "Module 4: Statistical Analysis", completed: false,
    lessons: [
      { id: 13, title: "Descriptive Statistics", duration: "20 min", status: "locked", type: "video" },
      { id: 14, title: "Hypothesis Testing", duration: "35 min", status: "locked", type: "video" },
      { id: 15, title: "Correlation & Regression", duration: "40 min", status: "locked", type: "video" },
      { id: 16, title: "Statistical Analysis Lab", duration: "50 min", status: "locked", type: "lab" },
    ],
  },
];

const typeConfig: Record<string, { color: string; label: string }> = {
  video: { color: "#2563eb", label: "Video" },
  lab: { color: "#059669", label: "Lab" },
  quiz: { color: "#7c3aed", label: "Quiz" },
  project: { color: "#f59e0b", label: "Project" },
};

const statusConfig = {
  completed: { icon: CheckCircle, color: "#22c55e", label: "Completed" },
  "in-progress": { icon: PlayCircle, color: "#2563eb", label: "In Progress" },
  locked: { icon: Lock, color: "#94a3b8", label: "Locked" },
};

export function Lessons() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [openModules, setOpenModules] = useState<number[]>([1, 2, 3]);

  const toggleModule = (id: number) => {
    setOpenModules((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const totalLessons = lessonModules.flatMap((m) => m.lessons).length;
  const completedLessons = lessonModules.flatMap((m) => m.lessons).filter((l) => l.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Lessons</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Follow your course curriculum lesson by lesson
        </p>
      </div>

      {/* Course Selector */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", fontWeight: 500 }}>SELECT COURSE</p>
        <div className="flex gap-2 flex-wrap">
          {courses.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCourse(c)}
              className="px-3.5 py-2 rounded-xl border transition-all"
              style={{
                fontSize: "12px",
                fontWeight: selectedCourse === c ? 600 : 400,
                backgroundColor: selectedCourse === c ? "#2563eb" : "#f8fafc",
                color: selectedCourse === c ? "white" : "#475569",
                borderColor: selectedCourse === c ? "#2563eb" : "#e2e8f0",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center gap-1.5">
            <BookMarked size={13} color="#2563eb" />
            <span style={{ fontSize: "12px", color: "#475569" }}>
              <strong>{completedLessons}</strong>/{totalLessons} lessons completed
            </span>
          </div>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(completedLessons / totalLessons) * 100}%`, backgroundColor: "#22c55e" }}
            />
          </div>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e" }}>
            {Math.round((completedLessons / totalLessons) * 100)}%
          </span>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {lessonModules.map((module) => (
          <div key={module.id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: module.completed ? "#f0fdf4" : "#eff6ff" }}
                >
                  {module.completed ? (
                    <CheckCircle size={16} color="#22c55e" />
                  ) : (
                    <BookMarked size={16} color="#2563eb" />
                  )}
                </div>
                <div className="text-left">
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{module.title}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {module.lessons.filter((l) => l.status === "completed").length}/{module.lessons.length} lessons
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {module.completed && (
                  <span
                    className="px-2.5 py-1 rounded-lg"
                    style={{ fontSize: "10px", fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a" }}
                  >
                    Complete
                  </span>
                )}
                {openModules.includes(module.id) ? (
                  <ChevronDown size={16} color="#94a3b8" />
                ) : (
                  <ChevronRight size={16} color="#94a3b8" />
                )}
              </div>
            </button>

            {/* Lessons */}
            {openModules.includes(module.id) && (
              <div className="border-t" style={{ borderColor: "#f1f5f9" }}>
                {module.lessons.map((lesson, idx) => {
                  const StatusIcon = statusConfig[lesson.status as keyof typeof statusConfig];
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${lesson.status === "locked" ? "opacity-50" : "hover:bg-slate-50 cursor-pointer"}`}
                      style={{ borderBottom: idx < module.lessons.length - 1 ? "1px solid #f8fafc" : "none" }}
                    >
                      <div className="flex items-center justify-center w-6 h-6">
                        <StatusIcon.icon size={16} color={StatusIcon.color} />
                      </div>
                      <div className="flex-1">
                        <p style={{ fontSize: "13px", fontWeight: lesson.status === "in-progress" ? 600 : 400, color: "#1e293b" }}>
                          {lesson.title}
                          {lesson.status === "in-progress" && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-md text-blue-600" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#eff6ff" }}>
                              CURRENT
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{ fontSize: "10px", fontWeight: 600, backgroundColor: `${typeConfig[lesson.type].color}15`, color: typeConfig[lesson.type].color }}
                        >
                          {typeConfig[lesson.type].label}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}>
                          <Clock size={11} />
                          {lesson.duration}
                        </div>
                        {lesson.status === "in-progress" && (
                          <button
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white transition-all"
                            style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#2563eb" }}
                          >
                            <PlayCircle size={12} /> Resume
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
