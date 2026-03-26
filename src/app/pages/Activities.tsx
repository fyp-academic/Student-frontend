import { Activity, PlayCircle, CheckCircle, Clock, Star, Users, Lock } from "lucide-react";

const activities = [
  {
    id: 1, code: "CS301", title: "Data Cleaning Lab Exercise", type: "Lab", duration: "45 min",
    status: "completed", score: 95, points: 20, dueDate: "Feb 18, 2026", color: "#2563eb",
    description: "Practice cleaning a messy real-world dataset using Pandas techniques.", participants: 120,
  },
  {
    id: 2, code: "CS301", title: "EDA Peer Review Activity", type: "Peer Review", duration: "30 min",
    status: "completed", score: 88, points: 15, dueDate: "Feb 14, 2026", color: "#2563eb",
    description: "Review and provide feedback on a classmate's exploratory data analysis.", participants: 85,
  },
  {
    id: 3, code: "MATH402", title: "Calculus Problem Solving Session", type: "Group Activity", duration: "60 min",
    status: "available", score: null, points: 25, dueDate: "Feb 28, 2026", color: "#7c3aed",
    description: "Collaborative problem-solving session for Chapter 8 exercises with your study group.", participants: 45,
  },
  {
    id: 4, code: "CS450", title: "Neural Network Visualization Activity", type: "Interactive", duration: "40 min",
    status: "available", score: null, points: 20, dueDate: "Mar 2, 2026", color: "#0891b2",
    description: "Use the TensorFlow Playground to experiment with neural network architectures.", participants: 200,
  },
  {
    id: 5, code: "BIO301", title: "Virtual Microscopy Lab", type: "Virtual Lab", duration: "50 min",
    status: "completed", score: 92, points: 30, dueDate: "Feb 10, 2026", color: "#059669",
    description: "Examine virtual slides and identify cell structures under different magnifications.", participants: 65,
  },
  {
    id: 6, code: "CS301", title: "Machine Learning Mini-Project", type: "Project", duration: "90 min",
    status: "locked", score: null, points: 50, dueDate: "Mar 10, 2026", color: "#2563eb",
    description: "Build a simple classification model on the provided dataset.", participants: 0,
  },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  Lab: { bg: "#eff6ff", text: "#2563eb" },
  "Peer Review": { bg: "#fdf4ff", text: "#9333ea" },
  "Group Activity": { bg: "#fefce8", text: "#ca8a04" },
  Interactive: { bg: "#f0fdfa", text: "#0d9488" },
  "Virtual Lab": { bg: "#f0fdf4", text: "#16a34a" },
  Project: { bg: "#fff7ed", text: "#ea580c" },
};

export function Activities() {
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Activities</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Labs, peer reviews, group activities, and more
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: activities.filter(a => a.status === "available").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed", value: activities.filter(a => a.status === "completed").length, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Points Earned", value: activities.filter(a => a.score).reduce((sum, a) => sum + (a.score ? a.points : 0), 0), color: "#7c3aed", bg: "#fdf4ff" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", opacity: activity.status === "locked" ? 0.6 : 1 }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: activity.color }}>
                    {activity.code}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", fontWeight: 600, ...typeColors[activity.type] }}
                  >
                    {activity.type}
                  </span>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{activity.title}</h3>
              </div>
              {activity.status === "locked" ? (
                <Lock size={18} color="#94a3b8" />
              ) : activity.score !== null ? (
                <div className="flex items-center gap-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#16a34a" }}>{activity.score}%</span>
                </div>
              ) : null}
            </div>

            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginBottom: "12px" }}>
              {activity.description}
            </p>

            <div className="flex items-center gap-3 mb-3 text-slate-400" style={{ fontSize: "11px" }}>
              <div className="flex items-center gap-1"><Clock size={11} />{activity.duration}</div>
              <div className="flex items-center gap-1"><Star size={11} />{activity.points} pts</div>
              {activity.participants > 0 && (
                <div className="flex items-center gap-1"><Users size={11} />{activity.participants} students</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
              <span style={{ fontSize: "11px", color: activity.status === "available" ? "#f59e0b" : "#94a3b8", fontWeight: activity.status === "available" ? 600 : 400 }}>
                {activity.status === "available" ? `Due: ${activity.dueDate}` : activity.status === "locked" ? "🔒 Locked" : `✓ Completed · ${activity.dueDate}`}
              </span>
              {activity.status === "available" ? (
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white"
                  style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                >
                  <PlayCircle size={13} /> Start
                </button>
              ) : activity.status === "completed" ? (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a" }}
                >
                  <CheckCircle size={12} /> Done
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
