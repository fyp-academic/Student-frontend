import { useState } from "react";
import { HelpCircle, Clock, CheckCircle, PlayCircle, Lock, Trophy, Target } from "lucide-react";

const quizzes = [
  { id: 1, code: "CS301", title: "Quiz 5: Machine Learning Concepts", topic: "Module 5", questions: 20, timeLimit: 30, dueDate: "Feb 26, 2026", status: "available", score: null, attempts: 0, maxAttempts: 2, color: "#2563eb" },
  { id: 2, code: "MATH402", title: "Quiz 5: Series & Sequences", topic: "Chapter 8", questions: 15, timeLimit: 25, dueDate: "Feb 26, 2026", status: "available", score: null, attempts: 0, maxAttempts: 2, color: "#7c3aed" },
  { id: 3, code: "CS301", title: "Quiz 4: Data Visualization", topic: "Module 4", questions: 15, timeLimit: 20, dueDate: "Feb 12, 2026", status: "completed", score: 93, attempts: 1, maxAttempts: 2, color: "#2563eb" },
  { id: 4, code: "CS450", title: "Quiz 2: Supervised Learning", topic: "Module 2", questions: 20, timeLimit: 30, dueDate: "Feb 10, 2026", status: "completed", score: 80, attempts: 2, maxAttempts: 2, color: "#0891b2" },
  { id: 5, code: "MATH402", title: "Quiz 4: Derivatives & Applications", topic: "Chapter 6", questions: 15, timeLimit: 25, dueDate: "Feb 5, 2026", status: "completed", score: 87, attempts: 1, maxAttempts: 2, color: "#7c3aed" },
  { id: 6, code: "BIO301", title: "Quiz 3: Cell Membrane & Transport", topic: "Module 3", questions: 18, timeLimit: 25, dueDate: "Jan 28, 2026", status: "completed", score: 91, attempts: 1, maxAttempts: 2, color: "#059669" },
  { id: 7, code: "CS301", title: "Quiz 6: Neural Networks", topic: "Module 6", questions: 20, timeLimit: 35, dueDate: "Mar 5, 2026", status: "locked", score: null, attempts: 0, maxAttempts: 2, color: "#2563eb" },
];

const getScoreColor = (score: number) => {
  if (score >= 90) return "#16a34a";
  if (score >= 80) return "#2563eb";
  if (score >= 70) return "#f59e0b";
  return "#dc2626";
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Fair";
  return "Needs Improvement";
};

export function Quizzes() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Available", "Completed", "Locked"];

  const filtered = activeFilter === "All" ? quizzes : quizzes.filter((q) => q.status === activeFilter.toLowerCase());
  const avgScore = Math.round(quizzes.filter((q) => q.score).reduce((sum, q) => sum + (q.score || 0), 0) / quizzes.filter((q) => q.score).length);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Quizzes</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Test your knowledge with course quizzes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: quizzes.filter(q => q.status === "available").length, color: "#2563eb", bg: "#eff6ff", icon: HelpCircle },
          { label: "Completed", value: quizzes.filter(q => q.status === "completed").length, color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle },
          { label: "Avg. Score", value: `${avgScore}%`, color: "#7c3aed", bg: "#fdf4ff", icon: Trophy },
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

      {/* Filter */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeFilter === f ? 600 : 400,
              backgroundColor: activeFilter === f ? "#2563eb" : "white",
              color: activeFilter === f ? "white" : "#475569",
              borderColor: activeFilter === f ? "#2563eb" : "#e2e8f0",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((quiz) => (
          <div
            key={quiz.id}
            className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", opacity: quiz.status === "locked" ? 0.6 : 1 }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: quiz.color }}>
                    {quiz.code}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{quiz.topic}</span>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{quiz.title}</h3>
              </div>
              {quiz.status === "locked" ? (
                <Lock size={18} color="#94a3b8" />
              ) : quiz.score !== null ? (
                <div className="text-center">
                  <p style={{ fontSize: "22px", fontWeight: 700, color: getScoreColor(quiz.score) }}>{quiz.score}%</p>
                  <p style={{ fontSize: "10px", color: getScoreColor(quiz.score), fontWeight: 600 }}>{getScoreLabel(quiz.score)}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-4 mb-4" style={{ fontSize: "11px", color: "#94a3b8" }}>
              <div className="flex items-center gap-1">
                <HelpCircle size={11} />
                {quiz.questions} questions
              </div>
              <div className="flex items-center gap-1">
                <Clock size={11} />
                {quiz.timeLimit} min
              </div>
              <div className="flex items-center gap-1">
                <Target size={11} />
                {quiz.attempts}/{quiz.maxAttempts} attempts
              </div>
            </div>

            {quiz.score !== null && (
              <div className="mb-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                  <div className="h-full rounded-full" style={{ width: `${quiz.score}%`, backgroundColor: getScoreColor(quiz.score) }} />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span style={{ fontSize: "11px", color: quiz.status === "available" ? "#f59e0b" : "#94a3b8", fontWeight: quiz.status === "available" ? 600 : 400 }}>
                {quiz.status === "available" ? `⚡ Due: ${quiz.dueDate}` : quiz.status === "locked" ? "🔒 Complete prev. module" : `✓ Completed · ${quiz.dueDate}`}
              </span>
              {quiz.status === "available" && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white transition-all"
                  style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                >
                  <PlayCircle size={13} />
                  Start Quiz
                </button>
              )}
              {quiz.status === "completed" && quiz.attempts < quiz.maxAttempts && (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:bg-blue-50"
                  style={{ fontSize: "12px", color: "#2563eb", borderColor: "#bfdbfe" }}
                >
                  Retake
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
