import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Eye, Calendar, Loader2 } from "lucide-react";
import { assignmentsApi } from "../services/api";

const tabs = ["All", "Pending", "Submitted", "Graded", "Overdue"];

const statusConfig = {
  pending: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff", icon: CheckCircle },
  graded: { label: "Graded", color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  overdue: { label: "Overdue", color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#f59e0b", "#e11d48"];

export function Assignments() {
  const [activeTab, setActiveTab] = useState("All");
  const [raw, setRaw]             = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    assignmentsApi.mySubmissions()
      .then(r => setRaw(r.data.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const assignments = raw.map((a, i) => ({
    id:          String(a.id),
    code:        String(a.course_code   ?? a.code        ?? ''),
    title:       String(a.activity_name ?? a.title       ?? ''),
    dueDate:     String(a.due_date      ?? ''),
    dueTime:     String(a.due_time      ?? ''),
    points:      Number(a.grade_max     ?? a.points      ?? 0),
    earned:      a.grade !== null && a.grade !== undefined ? Number(a.grade) : null,
    status:      String(a.submission_status ?? a.status ?? 'pending'),
    urgent:      Boolean(a.urgent),
    color:       COLORS[i % COLORS.length],
    description: String(a.description   ?? ''),
    submittedAt: a.submitted_at ? String(a.submitted_at) : null,
  }));

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
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <FileText size={36} className="mx-auto mb-3 text-slate-200" />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No assignments found</p>
        </div>
      )}
      <div className="space-y-4">
        {!loading && filtered.map((assignment) => {
          const status = statusConfig[assignment.status as keyof typeof statusConfig] ?? statusConfig.pending;
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
