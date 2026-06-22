import { useState, useEffect } from "react";
import {
  Users, Loader2, CheckCircle, Clock, AlertCircle, Calendar,
  ChevronDown, ChevronRight, Download, FileText,
} from "lucide-react";
import { groupWorksApi } from "../services/api";

type GroupSubmission = {
  id: string;
  student_id: string;
  student_name: string;
  group_name: string;
  status: string;
  grade: number | null;
  file_name: string | null;
  file_url: string | null;
  submitted_at: string | null;
  is_mine: boolean;
};

type GroupTask = {
  activity_id: string;
  title: string;
  due_date: string | null;
  my_status: string;
  my_grade: number | null;
  submissions: GroupSubmission[];
};

type CourseGroupWork = {
  course_id: string;
  course_name: string;
  group_name: string;
  tasks: GroupTask[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  submitted:     { label: "Submitted",     color: "#2563eb", bg: "#eff6ff", icon: CheckCircle },
  graded:        { label: "Graded",        color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle },
  not_submitted: { label: "Not submitted", color: "#f59e0b", bg: "#fffbeb", icon: Clock },
};

const fmtDate = (d: string | null) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
};

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.not_submitted;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ fontSize: "11px", fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg }}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function TaskCard({ task }: { task: GroupTask }) {
  const [open, setOpen] = useState(false);
  const due = fmtDate(task.due_date);
  return (
    <div className="rounded-xl border" style={{ borderColor: "#e2e8f0" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-slate-50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
            <FileText size={18} style={{ color: "#2563eb" }} />
          </div>
          <div className="min-w-0">
            <p className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{task.title}</p>
            {due && (
              <span className="inline-flex items-center gap-1" style={{ fontSize: "12px", color: "#64748b" }}>
                <Calendar size={12} /> Due {due}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusPill status={task.my_status} />
          {open ? <ChevronDown size={16} style={{ color: "#94a3b8" }} /> : <ChevronRight size={16} style={{ color: "#94a3b8" }} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <p className="mb-2" style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>
            Group submissions ({task.submissions.length})
          </p>
          {task.submissions.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>No one in your group has submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {task.submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: s.is_mine ? "#f0f9ff" : "#f8fafc", border: s.is_mine ? "1px solid #bae6fd" : "1px solid #f1f5f9" }}
                >
                  <div className="min-w-0">
                    <p className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                      {s.student_name}{s.is_mine && <span style={{ color: "#2563eb", fontWeight: 500 }}> (You)</span>}
                    </p>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {s.submitted_at ? fmtDate(s.submitted_at) : "—"}
                      {s.grade !== null && s.grade !== undefined && ` · Grade: ${s.grade}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusPill status={s.status} />
                    {s.file_url && (
                      <a
                        href={s.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-200 transition-colors"
                        style={{ fontSize: "11px", color: "#475569" }}
                        title={s.file_name ?? "Download"}
                      >
                        <Download size={12} /> File
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GroupWorks() {
  const [data, setData] = useState<CourseGroupWork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    groupWorksApi.list()
      .then((r) => { if (!cancelled) setData(r.data?.data ?? []); })
      .catch(() => { if (!cancelled) setData([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Group Works</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Tasks assigned to your groups, and what your group members have submitted.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" style={{ color: "#2563eb" }} />
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: "#e2e8f0" }}>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: "#f1f5f9" }}>
            <Users size={22} style={{ color: "#94a3b8" }} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#475569" }}>No group works yet</p>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            You'll see tasks here once you're assigned to a group with assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((course) => (
            <div key={course.course_id} className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#f8fafc" }}>
                <div className="min-w-0">
                  <p className="truncate" style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{course.course_name}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0"
                  style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed", backgroundColor: "#f5f3ff" }}
                >
                  <Users size={13} /> {course.group_name}
                </span>
              </div>
              <div className="p-4 space-y-3">
                {course.tasks.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>No tasks assigned to this group yet.</p>
                ) : (
                  course.tasks.map((task) => <TaskCard key={task.activity_id} task={task} />)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
