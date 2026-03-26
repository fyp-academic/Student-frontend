import { useState } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Eye, Calendar } from "lucide-react";

const tabs = ["All", "Pending", "Submitted", "Graded", "Overdue"];

const assignments = [
  {
    id: 1, code: "CS301", title: "Assignment 3: Pandas DataFrames & Data Cleaning",
    dueDate: "Feb 25, 2026", dueTime: "11:59 PM", points: 100, earned: null,
    status: "pending", urgent: true, color: "#2563eb",
    description: "Clean and analyze the provided dataset using Pandas. Handle missing values, outliers, and perform exploratory data analysis.",
    attachments: 2, submittedAt: null,
  },
  {
    id: 2, code: "BIO301", title: "Lab Report 4: Cell Division & Mitosis",
    dueDate: "Mar 1, 2026", dueTime: "11:59 PM", points: 80, earned: null,
    status: "pending", urgent: false, color: "#059669",
    description: "Document your observations from the mitosis lab. Include diagrams, data tables, and analysis of cell division stages.",
    attachments: 0, submittedAt: null,
  },
  {
    id: 3, code: "CS301", title: "Assignment 2: Data Visualization with Matplotlib",
    dueDate: "Feb 15, 2026", dueTime: "11:59 PM", points: 100, earned: 92,
    status: "graded", urgent: false, color: "#2563eb",
    description: "Create a comprehensive visualization dashboard using Matplotlib and Seaborn.",
    attachments: 3, submittedAt: "Feb 14, 2026 10:32 PM",
  },
  {
    id: 4, code: "MATH402", title: "Problem Set 5: Series & Sequences",
    dueDate: "Feb 20, 2026", dueTime: "11:59 PM", points: 60, earned: 54,
    status: "graded", urgent: false, color: "#7c3aed",
    description: "Complete exercises on convergence tests, power series, and Taylor/Maclaurin expansions.",
    attachments: 1, submittedAt: "Feb 19, 2026 09:15 PM",
  },
  {
    id: 5, code: "CS450", title: "Assignment 1: Linear Regression Implementation",
    dueDate: "Feb 18, 2026", dueTime: "11:59 PM", points: 100, earned: null,
    status: "submitted", urgent: false, color: "#0891b2",
    description: "Implement linear regression from scratch using NumPy and compare with scikit-learn.",
    attachments: 2, submittedAt: "Feb 17, 2026 11:45 PM",
  },
  {
    id: 6, code: "CS201", title: "Project Milestone 1: UI Mockups",
    dueDate: "Feb 10, 2026", dueTime: "11:59 PM", points: 50, earned: null,
    status: "overdue", urgent: true, color: "#f59e0b",
    description: "Submit wireframes and UI mockups for your final project using Figma.",
    attachments: 0, submittedAt: null,
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff", icon: CheckCircle },
  graded: { label: "Graded", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  overdue: { label: "Overdue", color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

export function Assignments() {
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All"
    ? assignments
    : assignments.filter((a) => a.status === activeTab.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Assignments</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            Manage and submit your course assignments
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
          <AlertCircle size={14} color="#dc2626" />
          <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 600 }}>
            {assignments.filter((a) => a.urgent && a.status === "pending").length} urgent
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", count: assignments.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Pending", count: assignments.filter(a => a.status === "pending").length, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Submitted", count: assignments.filter(a => a.status === "submitted" || a.status === "graded").length, color: "#22c55e", bg: "#f0fdf4" },
          { label: "Overdue", count: assignments.filter(a => a.status === "overdue").length, color: "#dc2626", bg: "#fef2f2" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p style={{ fontSize: "22px", fontWeight: 700, color: s.color }}>{s.count}</p>
            <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
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

      {/* Assignment Cards */}
      <div className="space-y-4">
        {filtered.map((assignment) => {
          const status = statusConfig[assignment.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;
          return (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl p-5 transition-all hover:-translate-y-0.5"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                borderLeft: `3px solid ${assignment.urgent ? "#ef4444" : assignment.color}`,
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded-md text-white"
                      style={{ fontSize: "10px", fontWeight: 700, backgroundColor: assignment.color }}
                    >
                      {assignment.code}
                    </span>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                      style={{ fontSize: "10px", fontWeight: 600, backgroundColor: status.bg, color: status.color }}
                    >
                      <StatusIcon size={10} />
                      {status.label}
                    </span>
                    {assignment.urgent && assignment.status === "pending" && (
                      <span className="px-2 py-0.5 rounded-md text-red-600" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#fef2f2" }}>
                        ⚡ DUE SOON
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    {assignment.title}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5", marginBottom: "10px" }}>
                    {assignment.description}
                  </p>
                  <div className="flex items-center gap-4 text-slate-400" style={{ fontSize: "11px" }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due: {assignment.dueDate} at {assignment.dueTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={11} />
                      {assignment.points} points
                    </div>
                    {assignment.submittedAt && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={11} />
                        Submitted: {assignment.submittedAt}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
                  {assignment.earned !== null ? (
                    <div className="text-center">
                      <p style={{ fontSize: "22px", fontWeight: 700, color: "#16a34a" }}>
                        {assignment.earned}
                      </p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>/{assignment.points} pts</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>{assignment.points} pts</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {(assignment.status === "pending" || assignment.status === "overdue") && (
                      <button
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white transition-all"
                        style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                      >
                        <Upload size={13} /> Submit
                      </button>
                    )}
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all hover:bg-slate-50"
                      style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}
                    >
                      <Eye size={13} /> View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
