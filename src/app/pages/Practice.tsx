import { useState } from "react";
import { Target, PlayCircle, RotateCcw, Zap, Star, Clock, CheckCircle, TrendingUp } from "lucide-react";

const practiceCategories = [
  {
    id: 1, title: "Python Fundamentals", code: "CS301", color: "#2563eb",
    drills: [
      { id: 1, title: "List Comprehensions", difficulty: "Easy", questions: 10, bestScore: 100, attempts: 5, avgTime: "8 min" },
      { id: 2, title: "Dictionary Operations", difficulty: "Easy", questions: 10, bestScore: 90, attempts: 3, avgTime: "10 min" },
      { id: 3, title: "Functions & Lambda", difficulty: "Medium", questions: 15, bestScore: 80, attempts: 2, avgTime: "15 min" },
      { id: 4, title: "Object-Oriented Python", difficulty: "Hard", questions: 12, bestScore: null, attempts: 0, avgTime: "20 min" },
    ],
  },
  {
    id: 2, title: "Calculus Drills", code: "MATH402", color: "#7c3aed",
    drills: [
      { id: 5, title: "Differentiation Rules", difficulty: "Easy", questions: 20, bestScore: 95, attempts: 8, avgTime: "12 min" },
      { id: 6, title: "Integration Techniques", difficulty: "Medium", questions: 15, bestScore: 75, attempts: 4, avgTime: "18 min" },
      { id: 7, title: "Series Convergence", difficulty: "Hard", questions: 10, bestScore: 70, attempts: 2, avgTime: "25 min" },
    ],
  },
  {
    id: 3, title: "ML Concepts", code: "CS450", color: "#0891b2",
    drills: [
      { id: 8, title: "Supervised Learning", difficulty: "Medium", questions: 15, bestScore: 85, attempts: 3, avgTime: "15 min" },
      { id: 9, title: "Model Evaluation", difficulty: "Medium", questions: 12, bestScore: null, attempts: 0, avgTime: "12 min" },
    ],
  },
];

const difficultyConfig = {
  Easy: { color: "#16a34a", bg: "#f0fdf4" },
  Medium: { color: "#d97706", bg: "#fffbeb" },
  Hard: { color: "#dc2626", bg: "#fef2f2" },
};

const getDifficultyStars = (d: string) => d === "Easy" ? 1 : d === "Medium" ? 2 : 3;

export function Practice() {
  const [activeCategory, setActiveCategory] = useState(0);
  const category = practiceCategories[activeCategory];

  const totalAttempts = practiceCategories.flatMap(c => c.drills).reduce((sum, d) => sum + d.attempts, 0);
  const masteredDrills = practiceCategories.flatMap(c => c.drills).filter(d => d.bestScore && d.bestScore >= 90).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Practice</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Sharpen your skills with targeted practice drills
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Attempts", value: totalAttempts, icon: Target, color: "#2563eb", bg: "#eff6ff" },
          { label: "Drills Mastered", value: masteredDrills, icon: Star, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Practice Streak", value: "7 days", icon: Zap, color: "#f59e0b", bg: "#fffbeb" },
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

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {practiceCategories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(idx)}
            className="px-4 py-2 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeCategory === idx ? 600 : 400,
              backgroundColor: activeCategory === idx ? cat.color : "white",
              color: activeCategory === idx ? "white" : "#475569",
              borderColor: activeCategory === idx ? cat.color : "#e2e8f0",
            }}
          >
            {cat.code} — {cat.title}
          </button>
        ))}
      </div>

      {/* Drill Cards */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${category.color}15` }}>
            <Target size={16} color={category.color} />
          </div>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{category.title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {category.drills.map((drill) => {
            const diffConf = difficultyConfig[drill.difficulty as keyof typeof difficultyConfig];
            const stars = getDifficultyStars(drill.difficulty);
            return (
              <div
                key={drill.id}
                className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{drill.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="px-2 py-0.5 rounded-md"
                        style={{ fontSize: "10px", fontWeight: 600, backgroundColor: diffConf.bg, color: diffConf.color }}
                      >
                        {drill.difficulty}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Star key={i} size={10} color={i < stars ? "#f59e0b" : "#e2e8f0"} fill={i < stars ? "#f59e0b" : "#e2e8f0"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {drill.bestScore !== null && (
                    <div className="text-right">
                      <p style={{ fontSize: "20px", fontWeight: 700, color: drill.bestScore >= 90 ? "#16a34a" : drill.bestScore >= 75 ? "#2563eb" : "#f59e0b" }}>
                        {drill.bestScore}%
                      </p>
                      <p style={{ fontSize: "10px", color: "#94a3b8" }}>Best</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-3 text-slate-400" style={{ fontSize: "11px" }}>
                  <div className="flex items-center gap-1"><Target size={11} />{drill.questions} questions</div>
                  <div className="flex items-center gap-1"><Clock size={11} />~{drill.avgTime}</div>
                  <div className="flex items-center gap-1"><RotateCcw size={11} />{drill.attempts} attempts</div>
                </div>

                {drill.bestScore !== null && (
                  <div className="mb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div className="h-full rounded-full" style={{ width: `${drill.bestScore}%`, backgroundColor: drill.bestScore >= 90 ? "#22c55e" : drill.bestScore >= 75 ? "#2563eb" : "#f59e0b" }} />
                    </div>
                    {drill.bestScore >= 90 && (
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
                  >
                    <PlayCircle size={13} />
                    {drill.attempts > 0 ? "Practice Again" : "Start Drill"}
                  </button>
                  {drill.attempts > 0 && (
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-xl border transition-all hover:bg-slate-50"
                      style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}
                    >
                      <TrendingUp size={13} /> Stats
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
