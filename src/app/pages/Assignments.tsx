import { useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle, AlertCircle, Upload, Eye, Calendar,
  Loader2, X, Download, MessageSquare, Paperclip
} from "lucide-react";
import { assignmentsApi, dashboardApi } from "../services/api";

const tabs = ["All", "Pending", "Submitted", "Graded", "Overdue"];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  submitted: { label: "Submitted", color: "#2563eb", bg: "#eff6ff", icon: CheckCircle },
  graded:    { label: "Graded",    color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  overdue:   { label: "Overdue",   color: "#dc2626", bg: "#fef2f2", icon: AlertCircle },
};

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#f59e0b", "#e11d48"];

type Submission = {
  id: string;
  activity_id: string;
  status: string;
  grade: number | null;
  feedback: string;
  file_name: string;
  file_url: string;
  submission_text: string;
  submitted_at: string | null;
};

type AssignmentItem = {
  id: string;
  activity_id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  points: number;
  earned: number | null;
  status: string;
  urgent: boolean;
  color: string;
  submittedAt: string | null;
  feedback: string;
  submission_text: string;
  submission_file: string;
  submission_file_url: string;
};

export function Assignments() {
  const [activeTab, setActiveTab] = useState("All");
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [viewing, setViewing] = useState<AssignmentItem | null>(null);
  const [submittingTo, setSubmittingTo] = useState<AssignmentItem | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      dashboardApi.studentHub().then(r => r.data.enrolled_courses ?? []).catch(() => []),
      assignmentsApi.mySubmissions().then(r => r.data.data ?? r.data ?? []).catch(() => []),
    ]).then(([enrolledCourses, submissions]) => {
      if (cancelled) return;

      const subMap = new Map<string, Submission>();
      for (const s of submissions as Record<string, unknown>[]) {
        const sid = String(s.activity_id ?? '');
        if (sid) subMap.set(sid, {
          id: String(s.id ?? ''),
          activity_id: sid,
          status: String(s.status ?? 'submitted'),
          grade: s.grade !== null && s.grade !== undefined ? Number(s.grade) : null,
          feedback: String(s.feedback ?? ''),
          file_name: String(s.file_name ?? ''),
          file_url: String(s.file_url ?? ''),
          submission_text: String(s.submission_text ?? ''),
          submitted_at: s.submitted_at ? String(s.submitted_at) : null,
        });
      }

      const items: AssignmentItem[] = [];
      const courses = (enrolledCourses as Record<string, unknown>[]);
      let colorIdx = 0;

      for (const enrollment of courses) {
        const course = (enrollment.course ?? enrollment) as Record<string, unknown>;
        const sections = (course.sections ?? []) as Record<string, unknown>[];
        const cname = String(course.name ?? course.title ?? '');
        const ccode = String(course.short_name ?? course.code ?? '');
        const cid   = String(course.id ?? '');

        for (const sec of sections) {
          const acts = (sec.activities ?? []) as Record<string, unknown>[];
          for (const act of acts) {
            const t = String(act.type ?? act.activity_type ?? '').toLowerCase();
            if (t !== 'assignment') continue;
            const aid = String(act.id ?? '');
            if (!aid) continue;

            const settings = (act.settings ?? {}) as Record<string, unknown>;
            const due = String(act.due_date ?? settings.due_date ?? '');
            const dueTime = String(settings.due_time ?? '23:59');
            const points = Number(act.grade_max ?? settings.grade_max ?? settings.max_points ?? 0);
            const sub = subMap.get(aid);

            // Determine status
            let status = sub ? sub.status.toLowerCase() : 'pending';
            let isOverdue = false;
            if (due && status === 'pending') {
              const dueDate = new Date(due + 'T' + (dueTime || '23:59'));
              if (dueDate < new Date()) { status = 'overdue'; isOverdue = true; }
            }
            // If submission exists but no explicit status, treat as submitted
            if (sub && status === 'pending') status = 'submitted';

            const urgent = status === 'pending' && !isOverdue && due ?
              (new Date(due).getTime() - Date.now() < 172800000) : false; // due within 48h

            items.push({
              id: sub ? sub.id : aid,
              activity_id: aid,
              course_id: cid,
              course_name: cname,
              course_code: ccode,
              title: String(act.name ?? act.title ?? 'Assignment'),
              description: String(act.description ?? settings.description ?? ''),
              due_date: due,
              due_time: dueTime,
              points,
              earned: sub?.grade ?? null,
              status,
              urgent,
              color: COLORS[colorIdx % COLORS.length],
              submittedAt: sub?.submitted_at ?? null,
              feedback: sub?.feedback ?? '',
              submission_text: sub?.submission_text ?? '',
              submission_file: sub?.file_name ?? '',
              submission_file_url: sub?.file_url ?? '',
            });
            colorIdx++;
          }
        }
      }

      setAssignments(items);
    }).finally(() => setLoading(false));

    return () => { cancelled = true; };
  }, []);

  const filtered = activeTab === "All"
    ? assignments
    : assignments.filter((a) => {
        if (activeTab === "Submitted") return a.status === "submitted" || a.status === "graded";
        return a.status === activeTab.toLowerCase();
      });

  const handleOpenSubmit = (item: AssignmentItem) => {
    setSubmittingTo(item);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleSubmitAssignment = async () => {
    if (!submittingTo) return;
    setSubmitLoading(true);
    try {
      const fd = new FormData();
      fd.append('submission_text', submissionText);
      if (submissionFile) fd.append('file', submissionFile);
      await assignmentsApi.submit(submittingTo.activity_id, fd);
      // Refresh after submit
      setAssignments(prev => prev.map(a => a.activity_id === submittingTo.activity_id ? { ...a, status: 'submitted', submittedAt: new Date().toISOString() } : a));
      setSubmittingTo(null);
    } catch (e) {
      console.error('Submit failed', e);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

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
          const status = statusConfig[assignment.status] ?? statusConfig.pending;
          const StatusIcon = status.icon;
          return (
            <div
              key={assignment.activity_id}
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
                      {assignment.course_code || assignment.course_name}
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
                  <div className="flex flex-wrap items-center gap-4 text-slate-400" style={{ fontSize: "11px" }}>
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due: {assignment.due_date || '—'} {assignment.due_time && `at ${assignment.due_time}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText size={11} />
                      {assignment.points} points
                    </div>
                    {assignment.submittedAt && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={11} />
                        Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}
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
                        onClick={() => handleOpenSubmit(assignment)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white transition-all hover:opacity-90"
                        style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}
                      >
                        <Upload size={13} /> Submit
                      </button>
                    )}
                    <button
                      onClick={() => setViewing(assignment)}
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

      {/* ── VIEW MODAL ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setViewing(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">{viewing.course_name}</p>
                <h2 className="text-lg font-bold text-slate-900">{viewing.title}</h2>
              </div>
              <button onClick={() => setViewing(null)} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> Due: {viewing.due_date || '—'} {viewing.due_time && `at ${viewing.due_time}`}</span>
                <span className="flex items-center gap-1"><FileText size={12} /> {viewing.points} points</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: statusConfig[viewing.status]?.bg, color: statusConfig[viewing.status]?.color, fontWeight: 600 }}>
                  {viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewing.description || 'No description provided.'}
              </div>

              {viewing.status !== 'pending' && viewing.status !== 'overdue' && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Your Submission</h3>
                  {viewing.submission_text && (
                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {viewing.submission_text}
                    </div>
                  )}
                  {viewing.submission_file && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Paperclip size={14} />
                        <span>{viewing.submission_file}</span>
                      </div>
                      {viewing.submission_file_url && (
                        <a
                          href={viewing.submission_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Download size={12} /> Download
                        </a>
                      )}
                    </div>
                  )}
                  {viewing.earned !== null && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#f0fdf4' }}>
                      <CheckCircle size={18} color="#16a34a" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">Grade: {viewing.earned} / {viewing.points}</p>
                        {viewing.feedback && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MessageSquare size={10} /> {viewing.feedback}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMIT MODAL ── */}
      {submittingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => !submitLoading && setSubmittingTo(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">{submittingTo.course_name}</p>
                <h2 className="text-lg font-bold text-slate-900">Submit: {submittingTo.title}</h2>
              </div>
              <button onClick={() => setSubmittingTo(null)} disabled={submitLoading} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 disabled:opacity-50">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-600">Submission text</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                  style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                  placeholder="Write your answer or reflection here..."
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-600">Attach file (optional)</label>
                <input
                  type="file"
                  onChange={(e) => setSubmissionFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {submissionFile && (
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <Paperclip size={10} /> {submissionFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSubmittingTo(null)} disabled={submitLoading} className="px-4 py-2 rounded-xl border text-slate-600 text-sm" style={{ borderColor: "#e2e8f0" }}>
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={submitLoading || (!submissionText.trim() && !submissionFile)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60 text-sm font-semibold"
                style={{ backgroundColor: "#2563eb" }}
              >
                {submitLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
