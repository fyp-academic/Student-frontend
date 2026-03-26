import { ClipboardList, Calendar, Clock, CheckCircle, AlertCircle, Trophy, Star } from "lucide-react";

const assessments = [
  {
    id: 1, code: "CS301", title: "Midterm Exam — Data Science Fundamentals",
    type: "Midterm", date: "Mar 10, 2026", time: "10:00 AM – 12:00 PM",
    duration: "2 hours", venue: "Hall B - Room 204", status: "upcoming",
    totalMarks: 100, earned: null, weight: "30%", color: "#2563eb",
    topics: ["Data Wrangling", "Visualization", "Statistics", "Basic ML"],
  },
  {
    id: 2, code: "MATH402", title: "Mid-Semester Assessment — Calculus II",
    type: "Assessment", date: "Mar 3, 2026", time: "2:00 PM – 3:30 PM",
    duration: "1.5 hours", venue: "Online - Proctored", status: "upcoming",
    totalMarks: 80, earned: null, weight: "25%", color: "#7c3aed",
    topics: ["Series", "Convergence Tests", "Power Series", "Taylor"],
  },
  {
    id: 3, code: "BIO301", title: "Lab Assessment — Microscopy & Cell Division",
    type: "Lab Practical", date: "Feb 20, 2026", time: "9:00 AM – 11:00 AM",
    duration: "2 hours", venue: "Biology Lab 3", status: "completed",
    totalMarks: 60, earned: 55, weight: "20%", color: "#059669",
    topics: ["Microscopy", "Cell Division", "Specimen Preparation"],
  },
  {
    id: 4, code: "CS450", title: "Progress Assessment — Machine Learning",
    type: "Assessment", date: "Feb 5, 2026", time: "Online",
    duration: "1 hour", venue: "Online", status: "completed",
    totalMarks: 50, earned: 43, weight: "15%", color: "#0891b2",
    topics: ["Linear Regression", "Classification", "Evaluation Metrics"],
  },
  {
    id: 5, code: "CS301", title: "Final Exam — Data Science Fundamentals",
    type: "Final", date: "May 15, 2026", time: "TBD",
    duration: "3 hours", venue: "TBD", status: "scheduled",
    totalMarks: 150, earned: null, weight: "40%", color: "#2563eb",
    topics: ["All Modules"],
  },
];

const statusConfig = {
  upcoming: { label: "Upcoming", color: "#f59e0b", bg: "#fffbeb", icon: AlertCircle },
  completed: { label: "Completed", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "#2563eb", bg: "#eff6ff", icon: Calendar },
};

const typeColors: Record<string, string> = {
  Midterm: "#dc2626",
  Assessment: "#2563eb",
  "Lab Practical": "#059669",
  Final: "#7c3aed",
};

export function Assessments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Assessments</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Exams, midterms, and formal assessments
        </p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming", value: assessments.filter(a => a.status !== "completed").length, icon: Calendar, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Completed", value: assessments.filter(a => a.status === "completed").length, icon: CheckCircle, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Avg. Score", value: "82%", icon: Trophy, color: "#2563eb", bg: "#eff6ff" },
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

      {/* Assessment Cards */}
      <div className="space-y-4">
        {assessments.map((item) => {
          const status = statusConfig[item.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <ClipboardList size={22} color={item.color} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: item.color }}>
                        {item.code}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-md"
                        style={{ fontSize: "10px", fontWeight: 700, backgroundColor: `${typeColors[item.type]}15`, color: typeColors[item.type] }}
                      >
                        {item.type}
                      </span>
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                        style={{ fontSize: "10px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}
                      >
                        <StatusIcon size={10} />
                        {status.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-slate-400" style={{ fontSize: "11px" }}>
                      <div className="flex items-center gap-1"><Calendar size={11} />{item.date}</div>
                      <div className="flex items-center gap-1"><Clock size={11} />{item.time} · {item.duration}</div>
                      <span>📍 {item.venue}</span>
                      <span>Weight: <strong style={{ color: "#475569" }}>{item.weight}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.topics.map((topic) => (
                        <span key={topic} className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:flex-col md:items-end">
                  {item.earned !== null ? (
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: "22px", fontWeight: 700, color: "#16a34a" }}>{item.earned}</span>
                        <span style={{ fontSize: "13px", color: "#94a3b8" }}>/{item.totalMarks}</span>
                      </div>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {Math.round((item.earned / item.totalMarks) * 100)}%
                      </p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>{item.totalMarks} pts</p>
                    </div>
                  )}
                  {item.status === "upcoming" && (
                    <button
                      className="px-4 py-2 rounded-xl text-white transition-all"
                      style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                    >
                      Study Guide
                    </button>
                  )}
                  {item.status === "completed" && (
                    <button
                      className="px-4 py-2 rounded-xl border transition-all hover:bg-slate-50"
                      style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}
                    >
                      View Results
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
