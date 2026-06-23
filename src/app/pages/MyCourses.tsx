import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router";
import { BookOpen, Clock, TrendingUp, CheckCircle, PlayCircle, Loader2, LayoutGrid, List, MoreVertical } from "lucide-react";
import { useRealtime } from "../context/RealtimeContext";
import { coursesApi } from "../services/api";
import { resolveAssetUrl } from "../components/ui/utils";

const tabs = ["All", "In Progress", "Completed", "Not Started"];

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#0891b2", "#f59e0b", "#e11d48"];

const gradeColors: Record<string, string> = {
  "A+": "#16a34a", A: "#16a34a", "A-": "#22c55e",
  "B+": "#2563eb", B: "#3b82f6", "B-": "#60a5fa",
  "—": "#94a3b8",
};

function deriveStatus(progress: number): string {
  if (progress === 0)   return "Not Started";
  if (progress >= 100)  return "Completed";
  return "In Progress";
}

export function MyCourses() {
  const [activeTab, setActiveTab]   = useState("All");
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid');
  const [courses, setCourses]       = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]       = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string>('');
  const [unenrollingId, setUnenrollingId] = useState<string>('');
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const { refreshTrigger } = useRealtime();

  useEffect(() => {
    setLoading(true);
    coursesApi.myCourses()
      .then(r => setCourses(r.data.data ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  const enriched = courses.map((c, i) => ({
    id:           String(c.id),
    code:         String(c.short_name ?? c.shortName ?? ''),
    title:        String(c.name       ?? ''),
    image:        String(c.image ?? c.image_url ?? ''),
    instructor:   String(c.instructor_name ?? c.instructor ?? ''),
    progress:     Number(c.completion_rate ?? 0),
    lessonsTotal: Number(c.total_sections   ?? 0),
    lessonsDone:  Number(c.completed_sections ?? 0),
    status:       deriveStatus(Number(c.completion_rate ?? 0)),
    color:        COLORS[i % COLORS.length],
    grade:        String(c.current_grade ?? '—'),
    lastActivity: String(c.last_accessed ?? ''),
  }));

  const filtered = activeTab === "All" ? enriched : enriched.filter((c) => c.status === activeTab);

  const handleUnenroll = async (courseId: string) => {
    setUnenrollingId(courseId);
    try {
      await coursesApi.leave(courseId);
      setCourses(prev => prev.map(c =>
        String(c.id) === courseId ? { ...c, is_enrolled: false, enrolled: false } : c
      ));
    } catch { /* ignore */ }
    finally { setUnenrollingId(''); setOpenMenuId(''); }
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>My Courses</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            You are enrolled in {enriched.length} courses this semester
          </p>
        </div>
        <NavLink
          to="/catalog"
          className="px-4 py-2 rounded-xl text-white transition-all"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}
        >
          + Enroll New
        </NavLink>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Progress", count: enriched.filter(c => c.status === "In Progress").length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed",   count: enriched.filter(c => c.status === "Completed").length,   color: "#22c55e", bg: "#f0fdf4" },
          { label: "Not Started", count: enriched.filter(c => c.status === "Not Started").length, color: "#f59e0b", bg: "#fffbeb" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.bg }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.count}</span>
            </div>
            <span style={{ fontSize: "13px", color: "#64748b" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs + View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
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
        <div className="flex items-center gap-1 rounded-xl border p-0.5" style={{ borderColor: "#e2e8f0" }}>
          <button onClick={() => setViewMode('grid')} title="Grid view"
            className="p-1.5 rounded-lg transition-all"
            style={{ backgroundColor: viewMode === 'grid' ? '#2563eb' : 'transparent', color: viewMode === 'grid' ? 'white' : '#64748b' }}>
            <LayoutGrid size={15} />
          </button>
          <button onClick={() => setViewMode('list')} title="List view"
            className="p-1.5 rounded-lg transition-all"
            style={{ backgroundColor: viewMode === 'list' ? '#2563eb' : 'transparent', color: viewMode === 'list' ? 'white' : '#64748b' }}>
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Courses */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-400" />
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>No courses found.</p>
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div className="h-28 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}66)` }}>
                {course.image ? (
                  <img src={resolveAssetUrl(course.image)} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="font-bold" style={{ fontSize: "15px", color: course.color }}>{course.code || 'COURSE'}</span>
                )}
                {course.status === "Completed" && (
                  <div className="absolute top-3 right-3"><CheckCircle size={16} color="#22c55e" /></div>
                )}
              </div>
              <div className="p-4">
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: "1.4" }}>{course.title}</h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{course.instructor}</p>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{course.lessonsDone}/{course.lessonsTotal} lessons</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: course.color }}>{course.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                    <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: course.progress === 100 ? "#22c55e" : course.color }} />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <div className="text-center">
                    <p style={{ fontSize: "10px", color: "#94a3b8" }}>Grade</p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: gradeColors[course.grade] || "#1e293b" }}>{course.grade}</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuId(openMenuId === course.id ? '' : course.id)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748b" }}>
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === course.id && (
                      <div ref={menuRef} className="absolute right-0 bottom-full mb-1 z-20 bg-white rounded-xl border py-1" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderColor: "#e2e8f0", minWidth: "120px" }}>
                        <button onClick={() => { setOpenMenuId(''); navigate('/lessons', { state: { courseId: course.id } }); }}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors" style={{ fontSize: "12px", color: "#1e293b", fontWeight: 500 }}>
                          <PlayCircle size={13} color="#2563eb" /> Start
                        </button>
                        <div className="mx-2" style={{ height: "1px", backgroundColor: "#f1f5f9" }} />
                        <button onClick={() => handleUnenroll(course.id)}
                          disabled={unenrollingId === course.id}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50" style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
                          {unenrollingId === course.id ? <Loader2 size={13} className="animate-spin" /> : <><PlayCircle size={13} /> Unenroll</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="space-y-4">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <div className="flex">
                {/* Thumbnail — course image when available, else colour block */}
                <div className="w-32 flex-shrink-0 hidden sm:flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${course.color}22, ${course.color}55)` }}>
                  {course.image ? (
                    <img src={resolveAssetUrl(course.image)} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold" style={{ fontSize: "13px", color: course.color }}>{course.code || 'COURSE'}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{course.title}</h3>
                        {course.status === "Completed" && <CheckCircle size={15} color="#22c55e" />}
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{course.instructor}</p>

                      {/* Progress */}
                      <div className="mt-3 max-w-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {course.lessonsDone}/{course.lessonsTotal} lessons
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: course.color }}>
                            {course.progress}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                          <div className="h-full rounded-full" style={{ width: `${course.progress}%`, backgroundColor: course.progress === 100 ? "#22c55e" : course.color }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {course.lastActivity && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock size={11} />
                            <span style={{ fontSize: "11px" }}>{course.lastActivity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                      <div className="text-center">
                        <p style={{ fontSize: "11px", color: "#94a3b8" }}>Grade</p>
                        <p style={{ fontSize: "18px", fontWeight: 700, color: gradeColors[course.grade] || "#1e293b" }}>
                          {course.grade}
                        </p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === course.id ? '' : course.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 transition-colors" style={{ color: "#64748b" }}>
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === course.id && (
                          <div ref={menuRef} className="absolute right-0 bottom-full mb-1 z-20 bg-white rounded-xl border py-1" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", borderColor: "#e2e8f0", minWidth: "120px" }}>
                            <button onClick={() => { setOpenMenuId(''); navigate('/lessons', { state: { courseId: course.id } }); }}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors" style={{ fontSize: "12px", color: "#1e293b", fontWeight: 500 }}>
                              <PlayCircle size={13} color="#2563eb" /> Start
                            </button>
                            <div className="mx-2" style={{ height: "1px", backgroundColor: "#f1f5f9" }} />
                            <button onClick={() => handleUnenroll(course.id)}
                              disabled={unenrollingId === course.id}
                              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50" style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500 }}>
                              {unenrollingId === course.id ? <Loader2 size={13} className="animate-spin" /> : <><PlayCircle size={13} /> Unenroll</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
