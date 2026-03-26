import { MousePointerClick, PlayCircle, Star, Clock, Users, CheckCircle, Gamepad2, Code, FlaskConical, Brain } from "lucide-react";

const activities = [
  {
    id: 1, code: "CS301", title: "Interactive: Pandas Cheat Sheet Explorer",
    type: "Interactive Reference", icon: Code, color: "#2563eb",
    description: "Click through Pandas methods with live code examples and immediate output.",
    status: "completed", rating: 4.8, users: 1240, duration: "20 min", xp: 50,
  },
  {
    id: 2, code: "MATH402", title: "3D Function Grapher",
    type: "Visualization Tool", icon: Brain, color: "#7c3aed",
    description: "Visualize multivariable functions in 3D — explore gradients, contour lines, and surfaces.",
    status: "completed", rating: 4.9, users: 890, duration: "30 min", xp: 60,
  },
  {
    id: 3, code: "CS450", title: "TensorFlow Playground — Neural Networks",
    type: "Simulation", icon: Brain, color: "#0891b2",
    description: "Experiment with neural network architecture, activation functions, and training in real-time.",
    status: "available", rating: 4.9, users: 3200, duration: "45 min", xp: 80,
  },
  {
    id: 4, code: "BIO301", title: "Virtual Cell Simulation",
    type: "Virtual Lab", icon: FlaskConical, color: "#059669",
    description: "Simulate cell membrane transport, organelle functions, and metabolic pathways.",
    status: "available", rating: 4.7, users: 650, duration: "35 min", xp: 70,
  },
  {
    id: 5, code: "CS301", title: "Data Visualization Challenge Game",
    type: "Gamified", icon: Gamepad2, color: "#dc2626",
    description: "Compete with classmates to create the best visualizations in timed challenges.",
    status: "available", rating: 4.6, users: 445, duration: "25 min", xp: 100,
  },
  {
    id: 6, code: "CS450", title: "Gradient Descent Simulator",
    type: "Simulation", icon: Brain, color: "#0891b2",
    description: "Watch gradient descent optimize in real-time with adjustable learning rates.",
    status: "completed", rating: 4.8, users: 2100, duration: "20 min", xp: 60,
  },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  "Interactive Reference": { bg: "#eff6ff", text: "#2563eb" },
  "Visualization Tool": { bg: "#fdf4ff", text: "#9333ea" },
  Simulation: { bg: "#f0fdfa", text: "#0d9488" },
  "Virtual Lab": { bg: "#f0fdf4", text: "#16a34a" },
  Gamified: { bg: "#fef2f2", text: "#dc2626" },
};

export function InteractiveActivities() {
  const completed = activities.filter(a => a.status === "completed").length;
  const totalXP = activities.filter(a => a.status === "completed").reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Interactive Activities</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Simulations, virtual labs, and gamified learning experiences
        </p>
      </div>

      {/* XP Banner */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #059669, #16a34a)", boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}
      >
        <div>
          <p style={{ fontSize: "13px", color: "#d1fae5" }}>Your Progress</p>
          <p className="text-white" style={{ fontSize: "18px", fontWeight: 700 }}>
            {completed}/{activities.length} Activities Completed
          </p>
          <p style={{ fontSize: "13px", color: "#d1fae5", marginTop: "2px" }}>
            Keep going to unlock bonus content!
          </p>
        </div>
        <div className="text-center">
          <p className="text-white" style={{ fontSize: "32px", fontWeight: 700 }}>⚡</p>
          <p className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>{totalXP} XP</p>
          <p style={{ fontSize: "11px", color: "#d1fae5" }}>Earned</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", value: activities.filter(a => a.status === "available").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed", value: completed, color: "#22c55e", bg: "#f0fdf4" },
          { label: "XP Earned", value: `${totalXP}`, color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-1"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${activity.color}15` }}
              >
                <activity.icon size={22} color={activity.color} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md text-white" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: activity.color }}>
                    {activity.code}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", fontWeight: 600, ...(typeColors[activity.type] || { bg: "#f1f5f9", text: "#475569" }) }}
                  >
                    {activity.type}
                  </span>
                </div>
                <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{activity.title}</h3>
                <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginTop: "4px" }}>
                  {activity.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-slate-400" style={{ fontSize: "11px" }}>
                  <div className="flex items-center gap-0.5">
                    <Star size={10} color="#f59e0b" fill="#f59e0b" />
                    <span>{activity.rating}</span>
                  </div>
                  <div className="flex items-center gap-1"><Users size={10} />{activity.users.toLocaleString()}</div>
                  <div className="flex items-center gap-1"><Clock size={10} />{activity.duration}</div>
                  <span className="text-green-600 font-semibold">+{activity.xp} XP</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  {activity.status === "completed" ? (
                    <span className="flex items-center gap-1 text-green-600" style={{ fontSize: "11px", fontWeight: 600 }}>
                      <CheckCircle size={12} /> Completed
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Ready to start</span>
                  )}
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white transition-all"
                    style={{ fontSize: "12px", fontWeight: 600, backgroundColor: activity.status === "completed" ? "#94a3b8" : activity.color }}
                  >
                    {activity.status === "completed" ? (
                      <><MousePointerClick size={12} /> Revisit</>
                    ) : (
                      <><PlayCircle size={12} /> Launch</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
