import { NavLink } from "react-router";
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  ArrowRight,
  Flame,
  Star,
  ChevronRight,
  FileText,
  HelpCircle,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

const weeklyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.0 },
  { day: "Wed", hours: 1.5 },
  { day: "Thu", hours: 4.0 },
  { day: "Fri", hours: 3.5 },
  { day: "Sat", hours: 2.0 },
  { day: "Sun", hours: 1.0 },
];

const progressData = [
  { month: "Sep", completed: 4 },
  { month: "Oct", completed: 9 },
  { month: "Nov", completed: 6 },
  { month: "Dec", completed: 11 },
  { month: "Jan", completed: 8 },
  { month: "Feb", completed: 14 },
];

const recentCourses = [
  {
    id: 1,
    code: "CS301",
    title: "Data Science Fundamentals",
    instructor: "Adelfina Mambali",
    progress: 72,
    image: "https://images.unsplash.com/photo-1617240016072-d92174e44171?w=400&h=200&fit=crop",
    color: "#2563eb",
    nextLesson: "Neural Networks Basics",
    lessonsLeft: 8,
  },
  {
    id: 2,
    code: "MATH402",
    title: "Advanced Calculus",
    instructor: "Prof. John Miller",
    progress: 45,
    image: "https://images.unsplash.com/photo-1732304719443-c3c04003bf25?w=400&h=200&fit=crop",
    color: "#7c3aed",
    nextLesson: "Multivariable Integration",
    lessonsLeft: 14,
  },
  {
    id: 3,
    code: "CS450",
    title: "AI & Machine Learning",
    instructor: "Dr. James Liu",
    progress: 23,
    image: "https://images.unsplash.com/photo-1749006590639-e749e6b7d84c?w=400&h=200&fit=crop",
    color: "#0891b2",
    nextLesson: "Supervised Learning",
    lessonsLeft: 22,
  },
];

const upcomingDeadlines = [
  { id: 1, title: "CS301 Assignment 3 — Pandas DataFrames", due: "Feb 25, 2026", type: "assignment", urgent: true },
  { id: 2, title: "MATH402 Quiz 5 — Series & Sequences", due: "Feb 26, 2026", type: "quiz", urgent: true },
  { id: 3, title: "BIO301 Lab Report — Cell Division", due: "Mar 1, 2026", type: "assignment", urgent: false },
  { id: 4, title: "CS450 Mid-term Assessment", due: "Mar 3, 2026", type: "assessment", urgent: false },
  { id: 5, title: "CS201 Project Milestone 2", due: "Mar 5, 2026", type: "assignment", urgent: false },
];

const recentActivity = [
  { id: 1, action: "Completed", item: "Lesson: Introduction to Pandas", course: "CS301", time: "2 hours ago", icon: CheckCircle, color: "#22c55e" },
  { id: 2, action: "Submitted", item: "Assignment 2: Data Cleaning", course: "CS301", time: "Yesterday", icon: FileText, color: "#2563eb" },
  { id: 3, action: "Scored 88%", item: "Quiz 4: Derivatives", course: "MATH402", time: "2 days ago", icon: HelpCircle, color: "#7c3aed" },
  { id: 4, action: "Started", item: "Lesson: Linear Regression", course: "CS450", time: "3 days ago", icon: BookOpen, color: "#0891b2" },
];

const riskSignal: "active" | "inactive" = "active";

const stats = [
  { label: "Enrolled Courses", value: "6", icon: BookOpen, color: "#2563eb", bg: "#eff6ff", trend: "+1 this semester" },
  { label: "Lessons Completed", value: "47", icon: CheckCircle, color: "#22c55e", bg: "#f0fdf4", trend: "+5 this week" },
  { label: "Pending Tasks", value: "8", icon: Clock, color: "#f59e0b", bg: "#fffbeb", trend: "2 due today" },
  {
    label: "At-Risk Check",
    value: riskSignal === "active" ? "Active" : "Inactive",
    icon: riskSignal === "active" ? ShieldCheck : AlertTriangle,
    color: riskSignal === "active" ? "#10b981" : "#ef4444",
    bg: riskSignal === "active" ? "#ecfdf5" : "#fef2f2",
    trend: riskSignal === "active" ? "All signals normal" : "Review support plan",
  },
];

const typeIcon: Record<string, React.ElementType> = {
  assignment: FileText,
  quiz: HelpCircle,
  assessment: Zap,
};

const typeColor: Record<string, string> = {
  assignment: "#2563eb",
  quiz: "#7c3aed",
  assessment: "#0891b2",
};

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
          boxShadow: "0 4px 20px rgba(37,99,235,0.35)",
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p style={{ fontSize: "13px", color: "#93c5fd", fontWeight: 500 }}>
              Tuesday, February 24, 2026
            </p>
            <h1 className="text-white mt-1" style={{ fontSize: "22px", fontWeight: 700 }}>
              Welcome back, Hamis! 👋
            </h1>
            <p style={{ fontSize: "14px", color: "#bfdbfe", marginTop: "4px" }}>
              You have <span className="text-white font-semibold">8 pending tasks</span> and{" "}
              <span className="text-white font-semibold">2 deadlines</span> due this week.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Flame size={15} color="#fbbf24" />
                <span style={{ fontSize: "13px", color: "#fef3c7" }}>14-day streak!</span>
              </div>           
            </div>
          </div>
          <div className="flex gap-3">
            <NavLink
              to="/my-courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-blue-700 transition-all hover:shadow-md"
              style={{ backgroundColor: "white", fontSize: "13px", fontWeight: 600 }}
            >
              My Courses <ArrowRight size={14} />
            </NavLink>
            <NavLink
              to="/assignments"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/30 text-white transition-all hover:bg-white/10"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              Tasks <span className="bg-white/20 rounded-full px-1.5" style={{ fontSize: "11px" }}>8</span>
            </NavLink>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
        <div className="absolute -right-4 -bottom-14 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "white" }} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-4 flex flex-col gap-2"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: stat.bg }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <span style={{ fontSize: "26px", fontWeight: 700, color: "#1e293b" }}>{stat.value}</span>
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "#64748b" }}>{stat.label}</p>
              <p style={{ fontSize: "11px", color: stat.color, fontWeight: 500, marginTop: "2px" }}>{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Continue Learning</h2>
            <NavLink to="/my-courses" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors" style={{ fontSize: "13px" }}>
              View all <ChevronRight size={14} />
            </NavLink>
          </div>
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl overflow-hidden flex transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <div className="w-24 flex-shrink-0 relative overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${course.color}88, transparent)` }} />
                </div>
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-white"
                        style={{ fontSize: "10px", backgroundColor: course.color, fontWeight: 600 }}
                      >
                        {course.code}
                      </span>
                      <p className="mt-1 text-slate-800" style={{ fontSize: "14px", fontWeight: 600 }}>
                        {course.title}
                      </p>
                      <p style={{ fontSize: "12px", color: "#64748b" }}>{course.instructor}</p>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: course.color, flexShrink: 0 }}>
                      {course.progress}%
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${course.progress}%`,
                          background: course.progress > 70
                            ? "linear-gradient(90deg, #22c55e, #16a34a)"
                            : course.progress > 40
                            ? "linear-gradient(90deg, #2563eb, #1d4ed8)"
                            : "linear-gradient(90deg, #f59e0b, #d97706)",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Next: {course.nextLesson}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {course.lessonsLeft} lessons left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Study Hours Chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Weekly Study Hours</h2>
              <span
                className="px-2.5 py-1 rounded-lg"
                style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: 600 }}
              >
                This Week: 17.5 hrs
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v) => [`${v} hrs`, "Study Time"]}
                />
                <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Upcoming Deadlines</h2>
              <Calendar size={16} color="#2563eb" />
            </div>
            <div className="space-y-2.5">
              {upcomingDeadlines.map((item) => {
                const Icon = typeIcon[item.type];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl transition-colors hover:bg-slate-50"
                    style={{ borderLeft: item.urgent ? "3px solid #ef4444" : "3px solid #e2e8f0" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `${typeColor[item.type]}15` }}
                    >
                      <Icon size={13} color={typeColor[item.type]} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-700 truncate" style={{ fontSize: "12px", fontWeight: 500 }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: "11px", color: item.urgent ? "#ef4444" : "#94a3b8", marginTop: "2px", fontWeight: item.urgent ? 600 : 400 }}>
                        {item.urgent && "⚡ "}Due {item.due}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <NavLink
              to="/assignments"
              className="flex items-center justify-center gap-1.5 mt-3 py-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              View All Tasks <ArrowRight size={13} />
            </NavLink>
          </div>

          {/* Progress Chart */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Lessons This Semester</h2>
              <TrendingUp size={16} color="#22c55e" />
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v) => [`${v} lessons`, "Completed"]}
                />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} fill="url(#greenGrad)" dot={{ fill: "#22c55e", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "12px" }}>Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${act.color}15` }}
                  >
                    <act.icon size={13} color={act.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "#475569" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{act.action}</span> {act.item}
                    </p>
                    <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                      {act.course} · {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
