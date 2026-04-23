import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { PlayCircle, Lock, CheckCircle, Clock, BookMarked, ChevronDown, ChevronRight, Loader2, X, FileText } from "lucide-react";
import { dashboardApi, quizApi, lessonApi } from "../services/api";

type Course  = Record<string, unknown>;
type Section = Record<string, unknown>;
type Activity = Record<string, unknown>;

const typeConfig: Record<string, { color: string; label: string }> = {
  video:       { color: "#2563eb", label: "Video" },
  lesson:      { color: "#2563eb", label: "Lesson" },
  lab:         { color: "#059669", label: "Lab" },
  quiz:        { color: "#7c3aed", label: "Quiz" },
  assignment:  { color: "#f59e0b", label: "Assignment" },
  project:     { color: "#f59e0b", label: "Project" },
  forum:       { color: "#0891b2", label: "Forum" },
  url:         { color: "#06b6d4", label: "URL" },
  file:        { color: "#64748b", label: "File" },
  h5p:         { color: "#dc2626", label: "H5P" },
  scorm:       { color: "#ca8a04", label: "SCORM" },
  workshop:    { color: "#7c3aed", label: "Workshop" },
  label:       { color: "#94a3b8", label: "Label" },
  page:        { color: "#2563eb", label: "Page" },
  resource:    { color: "#64748b", label: "Resource" },
};

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  completed:   { icon: CheckCircle, color: "#22c55e" },
  "in-progress": { icon: PlayCircle, color: "#2563eb" },
  locked:      { icon: Lock, color: "#94a3b8" },
};

export function Lessons() {
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [sections, setSections]       = useState<Section[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  // Video player state
  const [videoActivity, setVideoActivity] = useState<Activity | null>(null);

  // Page viewer state
  const [pageActivity, setPageActivity] = useState<Activity | null>(null);
  const [pageContent, setPageContent] = useState<string>('');

  // Quiz launcher
  const [startingQuiz, setStartingQuiz] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const r = await dashboardApi.studentHub();
      const list: Course[] = r.data.enrolled_courses ?? [];
      setEnrolledCourses(list);
      if (list.length > 0) {
        const first = (list[0].course ?? list[0]) as Course;
        setSelectedCourseId(String(first.id ?? ''));
      }
    } catch { /* ignore */ } finally { setCoursesLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const loadSections = useCallback((cid: string) => {
    if (!cid) return;
    setSectionsLoading(true);
    setSections([]);
    setOpenModules([]);
    const match = enrolledCourses.find((e: any) => {
      const c = (e.course ?? e) as any;
      return String(c.id ?? '') === cid;
    });
    const course = (match?.course ?? match ?? {}) as Course;
    const secs = (course.sections ?? []) as Section[];
    setSections(secs);
    if (secs.length > 0) setOpenModules([String(secs[0].id ?? '')]);
    setSectionsLoading(false);
  }, [enrolledCourses]);

  useEffect(() => {
    if (selectedCourseId) loadSections(selectedCourseId);
  }, [selectedCourseId, loadSections]);

  const toggleModule = (id: string) => {
    setOpenModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const allActivities = sections.flatMap(s => (s.activities as Activity[]) ?? []);
  const totalLessons     = allActivities.length;
  const completedLessons = allActivities.filter(a => String(a.status ?? '').toLowerCase() === 'completed').length;

  if (coursesLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Lessons</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>Follow your course curriculum lesson by lesson</p>
      </div>

      {/* Course Selector */}
      <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", fontWeight: 500 }}>SELECT COURSE</p>
        {enrolledCourses.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>No enrolled courses.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {enrolledCourses.map((e) => {
              const c    = (e.course ?? e) as Course;
              const cid  = String(c.id ?? '');
              const name = String(c.short_name ?? c.shortName ?? c.title ?? c.name ?? cid);
              const isActive = selectedCourseId === cid;
              return (
                <button key={cid} onClick={() => setSelectedCourseId(cid)}
                  className="px-3.5 py-2 rounded-xl border transition-all"
                  style={{ fontSize: "12px", fontWeight: isActive ? 600 : 400,
                    backgroundColor: isActive ? "#2563eb" : "#f8fafc",
                    color: isActive ? "white" : "#475569",
                    borderColor: isActive ? "#2563eb" : "#e2e8f0" }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        {totalLessons > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
            <div className="flex items-center gap-1.5">
              <BookMarked size={13} color="#2563eb" />
              <span style={{ fontSize: "12px", color: "#475569" }}><strong>{completedLessons}</strong>/{totalLessons} completed</span>
            </div>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#22c55e" }} />
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e" }}>{pct}%</span>
          </div>
        )}
      </div>

      {/* Modules */}
      {sectionsLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: "#2563eb" }} /></div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <BookMarked size={28} style={{ color: "#cbd5e1", margin: "0 auto 10px" }} />
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>No sections found for this course.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec) => {
            const secId   = String(sec.id ?? '');
            const secTitle = String(sec.title ?? sec.name ?? `Section`);
            const acts    = ((sec.activities ?? []) as Activity[]);
            const done    = acts.filter(a => String(a.status ?? '').toLowerCase() === 'completed').length;
            const isOpen  = openModules.includes(secId);
            const allDone = acts.length > 0 && done === acts.length;

            return (
              <div key={secId} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                <button onClick={() => toggleModule(secId)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: allDone ? "#f0fdf4" : "#eff6ff" }}>
                      {allDone ? <CheckCircle size={16} color="#22c55e" /> : <BookMarked size={16} color="#2563eb" />}
                    </div>
                    <div className="text-left">
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>{secTitle}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8" }}>{done}/{acts.length} activities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {allDone && <span className="px-2.5 py-1 rounded-lg" style={{ fontSize: "10px", fontWeight: 600, backgroundColor: "#f0fdf4", color: "#16a34a" }}>Complete</span>}
                    {isOpen ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronRight size={16} color="#94a3b8" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t" style={{ borderColor: "#f1f5f9" }}>
                    {acts.length === 0 ? (
                      <p className="px-4 py-3" style={{ fontSize: "13px", color: "#94a3b8" }}>No activities in this section.</p>
                    ) : acts.map((act, idx) => {
                      const aid      = String(act.id ?? idx);
                      const title    = String(act.name ?? act.title ?? `Activity ${idx + 1}`);
                      const rawType  = String(act.type ?? act.activity_type ?? 'resource').toLowerCase();
                      const typeCfg  = typeConfig[rawType] ?? typeConfig.resource;
                      const rawStatus = String(act.status ?? 'available').toLowerCase();
                      const statKey  = rawStatus === 'completed' ? 'completed' : rawStatus === 'in_progress' || rawStatus === 'in-progress' ? 'in-progress' : 'locked';
                      const StatIcon = statusConfig[statKey] ?? statusConfig.locked;
                      const isLocked = statKey === 'locked' && rawStatus !== 'available';
                      const isVideo  = rawType === 'video' || rawType === 'lesson';
                      const isQuiz   = rawType === 'quiz';
                      const videoUrl = String(act.url ?? act.video_url ?? act.file_url ?? '');
                      const duration = String(act.duration ?? act.time_limit ? `${act.time_limit} min` : '');

                      return (
                        <div
                          key={aid}
                          className={`flex items-center gap-4 px-4 py-3 transition-colors ${isLocked ? 'opacity-50' : 'hover:bg-slate-50 cursor-pointer'}`}
                          style={{ borderBottom: idx < acts.length - 1 ? "1px solid #f8fafc" : "none" }}
                        >
                          <div className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                            <StatIcon.icon size={16} color={StatIcon.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "13px", fontWeight: statKey === 'in-progress' ? 600 : 400, color: "#1e293b" }} className="truncate">
                              {title}
                              {statKey === 'in-progress' && <span className="ml-2 px-1.5 py-0.5 rounded-md text-blue-600" style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#eff6ff" }}>CURRENT</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 600, backgroundColor: `${typeCfg.color}15`, color: typeCfg.color }}>{typeCfg.label}</span>
                            {duration && <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}><Clock size={11} />{duration}</div>}
                            {isVideo && videoUrl && (
                              <button
                                onClick={() => setVideoActivity(act)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#2563eb" }}
                              >
                                <PlayCircle size={12} /> Watch
                              </button>
                            )}
                            {isQuiz && !isLocked && (
                              <button
                                disabled={startingQuiz === aid}
                                onClick={async () => {
                                  setStartingQuiz(aid);
                                  try {
                                    await quizApi.start(aid);
                                    navigate('/quizzes');
                                  } catch { /* ignore */ } finally { setStartingQuiz(null); }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#7c3aed", opacity: startingQuiz === aid ? 0.6 : 1 }}
                              >
                                {startingQuiz === aid ? <Loader2 size={11} className="animate-spin" /> : <PlayCircle size={12} />} Start
                              </button>
                            )}
                            {rawType === 'assignment' && !isLocked && (
                              <button
                                onClick={() => navigate('/assignments')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#f59e0b" }}
                              >
                                <BookMarked size={12} /> Submit
                              </button>
                            )}
                            {rawType === 'forum' && !isLocked && (
                              <button
                                onClick={() => window.open(`/forums/${aid}`, '_blank')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#0891b2" }}
                              >
                                <PlayCircle size={12} /> View
                              </button>
                            )}
                            {(rawType === 'url' || rawType === 'file') && !isLocked && (
                              <button
                                onClick={() => {
                                  const url = String(act.url || act.file_url || act.external_url || '');
                                  if (url) window.open(url, '_blank');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#64748b" }}
                              >
                                <PlayCircle size={12} /> Open
                              </button>
                            )}
                            {(rawType === 'page' || rawType === 'lesson') && !isLocked && (
                              <button
                                onClick={async () => {
                                  setPageActivity(act);
                                  try {
                                    const res = await lessonApi.listPages(aid);
                                    const pages = res.data.data ?? res.data ?? [];
                                    const firstPage = pages[0];
                                    setPageContent(String(firstPage?.content ?? act.description ?? act.settings?.content ?? 'No content available'));
                                  } catch {
                                    setPageContent(String(act.description ?? act.settings?.content ?? 'No content available'));
                                  }
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white"
                                style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#2563eb" }}
                              >
                                <FileText size={12} /> View
                              </button>
                            )}
                            {statKey === 'in-progress' && !isVideo && !isQuiz && rawType !== 'assignment' && rawType !== 'forum' && rawType !== 'url' && rawType !== 'file' && rawType !== 'page' && rawType !== 'lesson' && (
                              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#2563eb" }}>
                                <PlayCircle size={12} /> Resume
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {videoActivity && (() => {
        const url   = String(videoActivity.url ?? videoActivity.video_url ?? videoActivity.file_url ?? '');
        const title = String(videoActivity.name ?? videoActivity.title ?? 'Video');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-slate-900/70" onClick={() => setVideoActivity(null)} />
            <div className="relative w-full max-w-3xl bg-black rounded-2xl overflow-hidden" style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
                <p className="text-white font-semibold text-sm truncate">{title}</p>
                <button onClick={() => setVideoActivity(null)} className="text-slate-400 hover:text-white p-1"><X size={18} /></button>
              </div>
              <video
                src={url}
                controls
                autoPlay
                className="w-full"
                style={{ maxHeight: "70vh", background: "#000" }}
                onError={e => { (e.target as HTMLVideoElement).style.display = 'none'; }}
              >
                Your browser does not support the video tag.
              </video>
              <p className="text-xs text-slate-500 text-center py-2 bg-slate-900">{url}</p>
            </div>
          </div>
        );
      })()}

      {/* Page Viewer Modal */}
      {pageActivity && (() => {
        const title = String(pageActivity.name ?? pageActivity.title ?? 'Page');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-slate-900/70" onClick={() => { setPageActivity(null); setPageContent(''); }} />
            <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden" style={{ boxShadow: "0 30px 60px rgba(0,0,0,0.5)", maxHeight: "85vh" }}>
              <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b">
                <p className="text-slate-900 font-semibold text-sm truncate">{title}</p>
                <button onClick={() => { setPageActivity(null); setPageContent(''); }} className="text-slate-500 hover:text-slate-900 p-1"><X size={18} /></button>
              </div>
              <div className="overflow-y-auto p-6" style={{ maxHeight: "70vh" }}>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: pageContent }} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
