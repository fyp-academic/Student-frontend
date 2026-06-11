import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import { PlayCircle, Lock, CheckCircle, Clock, BookMarked, ChevronDown, ChevronRight, Loader2, X, FileText, ExternalLink, Menu, LayoutList, ArrowRight, Upload, Paperclip, MessageSquare, ThumbsUp, Eye, Plus, Search, Pin, Send, File, Download } from "lucide-react";
import { dashboardApi, lessonApi, activitiesApi, quizApi, assignmentsApi, forumApi, coursesApi, proctoringApi, adaptiveContentApi } from "../services/api";
import { AdaptiveContentBlock } from "../components/student/AdaptiveContentBlock";
import { AdaptiveActivityPanel } from "../components/student/AdaptiveActivityPanel";
import { PersonalizedCourseSidebar } from "../components/student/PersonalizedCourseSidebar";
import { VideoLearningPanel } from "../components/student/VideoLearningPanel";
import { usePersonalization } from "../hooks/usePersonalization";
import { presentationStyles } from "../types/personalization";
import { useProctoringMonitor } from '../hooks/useProctoringMonitor';
import ViolationWarningModal from '../components/ViolationWarningModal';
import { useAiWidgetContext } from "../context/AiWidgetContext";
import { useRealtime } from "../context/RealtimeContext";

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
  attendance:      { color: "#2563eb", label: "Attendance" },
  bigbluebutton:   { color: "#2563eb", label: "BBB" },
  book:            { color: "#2563eb", label: "Book" },
  checklist:       { color: "#059669", label: "Checklist" },
  choice:          { color: "#7c3aed", label: "Choice" },
  certificate:     { color: "#f59e0b", label: "Certificate" },
  database:        { color: "#64748b", label: "Database" },
  feedback:        { color: "#0891b2", label: "Feedback" },
  folder:          { color: "#64748b", label: "Folder" },
  glossary:        { color: "#2563eb", label: "Glossary" },
  ims_content_package: { color: "#ca8a04", label: "IMS CP" },
};

export function Lessons() {
  const { refreshTrigger } = useRealtime();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [sections, setSections]       = useState<Section[]>([]);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  // Active activity in content panel
  const [activeActivityId, setActiveActivityId] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [contentHtml, setContentHtml] = useState<string>('');
  const [contentTitle, setContentTitle] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoError, setVideoError] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');

  // Lesson multi-page state
  const [lessonPages, setLessonPages] = useState<Array<{ id: string; title: string; content: string; is_viewed?: boolean; sort_order?: number }>>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [lessonPagesLoading, setLessonPagesLoading] = useState(false);
  const [pageChunks, setPageChunks] = useState<Array<{ id: string; chunk_index: number; chunk_text: string; chunk_type: string }>>([]);
  const [pageChunksLoading, setPageChunksLoading] = useState(false);

  // Inline quiz runner state
  const [quizMode, setQuizMode] = useState<'idle' | 'running' | 'submitted'>('idle');
  const [quizQuestions, setQuizQuestions] = useState<Record<string, unknown>[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, unknown[]>>({});
  const [quizSelected, setQuizSelected] = useState<Record<string, string>>({});
  const [quizCurrentQ, setQuizCurrentQ] = useState(0);
  const [quizAttemptId, setQuizAttemptId] = useState<string>('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<Record<string, unknown> | null>(null);

  // Inline assignment submission state
  const [assignMode, setAssignMode] = useState<'idle' | 'form' | 'submitted'>('idle');
  const [assignText, setAssignText] = useState('');
  const [assignFile, setAssignFile] = useState<File | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  // Proctoring session key — truthy only while quiz is running or assignment form is open
  const [procKey, setProcKey] = useState<string | null>(null);
  const procCourseId = useRef<string>('');
  const procActivityId = useRef<string>('');
  const lastAutoOpenedId = useRef<string>('');

  // Inline forum state
  const [forumDiscussions, setForumDiscussions] = useState<Record<string, unknown>[]>([]);
  const [forumPosts, setForumPosts] = useState<Record<string, unknown>[]>([]);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string>('');
  const [forumLoading, setForumLoading] = useState(false);
  const [forumPostsLoading, setForumPostsLoading] = useState(false);
  const [forumReplyText, setForumReplyText] = useState('');
  const [forumReplying, setForumReplying] = useState(false);
  const [forumComposerOpen, setForumComposerOpen] = useState(false);
  const [forumNewThread, setForumNewThread] = useState({ title: '', category: 'General', details: '' });
  const [forumSubmitting, setForumSubmitting] = useState(false);
  const [forumSearch, setForumSearch] = useState('');

  // ─── Proctoring ────────────────────────────────────────────────────────────
  // Use a ref so the stable procForceSubmit callback always calls the latest
  // handleSubmitQuiz / handleSubmitAssignment without a stale closure.
  const procForceRef = useRef<(() => void) | null>(null);
  const procForceSubmit = useCallback(() => procForceRef.current?.(), []);

  const { webcamRef: procWebcamRef, canvasRef: procCanvasRef, warningCount: procWarningCount, lastViolation, dismissViolation, sessionId: procSessionId } =
    useProctoringMonitor({
      sessionKey:    procKey,
      activityId:    procActivityId.current,
      courseId:      procCourseId.current,
      contextType:   procKey?.startsWith('assign:') ? 'assignment' : 'quiz',
      quizAttemptId: procKey?.startsWith('quiz:') ? procKey.replace('quiz:', '') : undefined,
      onForceSubmit: procForceSubmit,
    });

  const location = useLocation();
  const { setContext } = useAiWidgetContext();
  const { context: personalization } = usePersonalization(selectedCourseId);
  const navigationConfig = personalization?.navigation ?? null;
  const presentationConfig = personalization?.presentation ?? null;

  // Helpers
  const rawTypeOf = (act: Activity) => String(act.type ?? act.activity_type ?? 'resource').toLowerCase();
  const rawStatusOf = (act: Activity) => String(act.completion_status ?? act.status ?? 'available').toLowerCase();
  const statKeyOf = (act: Activity) => {
    const rs = rawStatusOf(act);
    return rs === 'completed' ? 'completed' : (rs === 'in_progress' || rs === 'in-progress') ? 'in-progress' : rs === 'locked' ? 'locked' : 'available';
  };

  const allActivities: Activity[] = sections.flatMap(s => ((s.activities ?? []) as Activity[]));
  const totalLessons = allActivities.length;
  const completedLessons = allActivities.filter(a => statKeyOf(a) === 'completed').length;
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const activeIndex = allActivities.findIndex(a => String(a.id ?? '') === activeActivityId);
  const nextActivity = activeIndex >= 0 && activeIndex < allActivities.length - 1 ? allActivities[activeIndex + 1] : null;
  const activeActivity = allActivities.find(a => String(a.id ?? '') === activeActivityId) ?? null;
  const activeSection = sections.find(s => ((s.activities ?? []) as Activity[]).some(a => String(a.id ?? '') === activeActivityId));

  // Push AI context
  useEffect(() => {
    if (!selectedCourseId) return;
    const match = enrolledCourses.find((e: any) => {
      const c = (e.course ?? e) as any;
      return String(c.id ?? '') === selectedCourseId;
    });
    const course = (match?.course ?? match ?? {}) as Course;
    setContext({
      currentPage: '/lessons',
      courseId:     selectedCourseId,
      courseName:  String(course.name ?? course.short_name ?? ''),
      mode:        'study',
      activityType: undefined,
      topicId:      undefined,
      topicName:    undefined,
    });
  }, [selectedCourseId, enrolledCourses, setContext]);

  useEffect(() => { setVideoError(false); }, [videoUrl]);

  const loadData = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const r = await dashboardApi.studentHub();
      const list: Course[] = r.data.enrolled_courses ?? [];
      setEnrolledCourses(list);
      if (list.length > 0) {
        const passedId = (location.state as any)?.courseId;
        const match = passedId ? list.find((e: any) => String((e.course ?? e).id ?? '') === String(passedId)) : null;
        const target = match ? (match.course ?? match) : (list[0].course ?? list[0]);
        setSelectedCourseId(String((target as Course).id ?? ''));
      }
    } catch { /* ignore */ } finally { setCoursesLoading(false); }
  }, [location.state]);

  const refreshData = useCallback(async () => {
    try {
      const r = await dashboardApi.studentHub();
      const list: Course[] = r.data.enrolled_courses ?? [];
      setEnrolledCourses(list);
      // Fetch fresh sections directly from the public API to avoid stale embedded data
      if (selectedCourseId) {
        const sRes = await coursesApi.sections(selectedCourseId);
        const secs: Section[] = sRes.data.data ?? sRes.data ?? [];
        setSections(secs);
      }
    } catch { /* ignore */ }
  }, [selectedCourseId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (refreshTrigger > 0) refreshData();
  }, [refreshTrigger, refreshData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshData]);

  const loadSections = useCallback(async (cid: string) => {
    if (!cid) return;
    setSectionsLoading(true);
    setSections([]);
    setOpenModules([]);
    setActiveActivityId('');
    setContentHtml('');
    setVideoUrl('');
    setContentTitle('');
    try {
      const sRes = await coursesApi.sections(cid);
      const secs: Section[] = sRes.data.data ?? sRes.data ?? [];
      setSections(secs);
      if (secs.length > 0) {
        setOpenModules([String(secs[0].id ?? '')]);
        const firstActs = (secs[0].activities ?? []) as Activity[];
        if (firstActs.length > 0) setActiveActivityId(String(firstActs[0].id ?? ''));
      }
    } catch { /* ignore */ } finally {
      setSectionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) loadSections(selectedCourseId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const toggleModule = (id: string) => {
    setOpenModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  // Open activity content
  const openActivity = useCallback(async (act: Activity) => {
    const aid = String(act.id ?? '');
    lastAutoOpenedId.current = aid;
    const title = String(act.name ?? act.title ?? 'Activity');
    const rType = rawTypeOf(act);
    if (rawStatusOf(act) === 'locked') return;
    setActiveActivityId(aid);
    setContentTitle(title);
    setContentLoading(true);
    setVideoUrl('');
    setContentHtml('');
    setVideoError(false);
    setResourceUrl('');
    // Reset lesson state
    setLessonPages([]); setCurrentPageIndex(0);
    // Reset inline quiz/assignment/forum state
    setQuizMode('idle'); setQuizQuestions([]); setQuizAnswers({}); setQuizSelected({}); setQuizCurrentQ(0); setQuizResult(null);
    setAssignMode('idle'); setAssignText(''); setAssignFile(null);
    setForumDiscussions([]); setForumPosts([]); setSelectedDiscussionId(''); setForumComposerOpen(false); setForumSearch('');
    setContext({ topicId: aid, topicName: title, activityType: rType });
    // Ensure parent section open
    const parentSec = sections.find(s => ((s.activities ?? []) as Activity[]).some(a => String(a.id ?? '') === aid));
    if (parentSec) {
      const secId = String(parentSec.id ?? '');
      setOpenModules(prev => prev.includes(secId) ? prev : [...prev, secId]);
    }
    try {
      if (rType === 'video') {
        const settings = (act.settings ?? {}) as Record<string, unknown>;
        let url = '';
        const videoPath = String(settings.videoPath ?? settings.video_path ?? '');
        if (videoPath) {
          const base = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';
          const origin = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          url = videoPath.startsWith('/') ? `${origin}${videoPath}` : `${origin}/storage/${videoPath}`;
        } else {
          url = String(settings.videoUrl ?? settings.video_url ?? settings.url ?? act.url ?? act.video_url ?? act.file_url ?? '');
        }
        if (url && !url.match(/^https?:\/\//i)) {
          const base = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';
          const origin = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          url = url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
        }
        setVideoUrl(url);
      } else if (rType === 'page' || rType === 'lesson') {
        try {
          setLessonPagesLoading(true);
          const res = await lessonApi.listPages(aid);
          const pages = res.data.data ?? res.data ?? [];
          if (pages.length > 0) {
            setLessonPages(pages);
            setCurrentPageIndex(0);
            const firstPage = pages[0];
            if (firstPage?.id) {
              fetchPageChunks(firstPage.id);
              try { await lessonApi.markViewed(firstPage.id); } catch { /* silent */ }
            }
            // Check if all pages viewed and mark activity complete
            const allViewed = pages.every((p: any) => p.is_viewed);
            if (allViewed) {
              try {
                await activitiesApi.complete(aid, 'viewed');
                setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === aid ? { ...a, completion_status: 'completed' } : a) })));
              } catch { /* silent */ }
            }
          } else {
            // Fallback: no lesson pages, show activity description
            setContentHtml(String(act.description ?? (act.settings as any)?.content ?? 'No content available'));
            try {
              await activitiesApi.complete(aid, 'viewed');
              setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === aid ? { ...a, completion_status: 'completed' } : a) })));
            } catch { /* silent */ }
          }
        } catch {
          setContentHtml(String(act.description ?? (act.settings as any)?.content ?? 'No content available'));
        } finally { setLessonPagesLoading(false); }
      } else if (rType === 'quiz') {
        setContentHtml(`<div style="text-align:center;padding:48px 20px"><div style="width:64px;height:64px;border-radius:16px;background:#f5f3ff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:8px">${title}</h3><p style="font-size:13px;color:#64748b">Ready to test your knowledge? Click Start Quiz below.</p></div>`);
      } else if (rType === 'assignment') {
        setContentHtml(`<div style="text-align:center;padding:48px 20px"><div style="width:64px;height:64px;border-radius:16px;background:#fffbeb;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3 style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:8px">${title}</h3><p style="font-size:13px;color:#64748b">Submit your work for this assignment.</p></div>`);
      } else if (rType === 'url') {
        let url = String((act.settings as Record<string, unknown>)?.fileUrl ?? (act.settings as Record<string, unknown>)?.file_url ?? act.url ?? act.file_url ?? act.external_url ?? '');
        if (url && !url.match(/^https?:\/\//i)) {
          const base = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';
          const origin = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          url = url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
        }
        setContentHtml(`<div style="text-align:center;padding:48px 20px"><div style="width:64px;height:64px;border-radius:16px;background:#ecfeff;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div><h3 style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:8px">${title}</h3>${url ? `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:10px;background:#06b6d4;color:#fff;font-size:13px;font-weight:600;text-decoration:none;margin-top:16px">Open Resource</a>` : '<p style="font-size:13px;color:#94a3b8">No URL available.</p>'}</div>`);
        try {
          await activitiesApi.complete(aid, 'viewed');
          setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === aid ? { ...a, completion_status: 'completed' } : a) })));
        } catch { /* silent */ }
      } else if (rType === 'file') {
        const fileSettings = (act.settings ?? {}) as Record<string, unknown>;
        let url = '';
        const filePath = String(fileSettings.filePath ?? fileSettings.file_path ?? '');
        if (filePath) {
          const base = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';
          const origin = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          url = filePath.startsWith('/') ? `${origin}${filePath}` : `${origin}/storage/${filePath}`;
        } else {
          url = String(fileSettings.fileUrl ?? fileSettings.file_url ?? act.url ?? act.file_url ?? act.external_url ?? '');
        }
        if (url && !url.match(/^https?:\/\//i)) {
          const base = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';
          const origin = base.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
          url = url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
        }
        setResourceUrl(url);
        setFileMimeType(String(fileSettings.mimeType ?? ''));
        const fileName = String((act.settings as Record<string, unknown>)?.fileName ?? act.name ?? title);
        const fileSize = String((act.settings as Record<string, unknown>)?.fileSize ?? '');
        if (!url) {
          setContentHtml(`<div style="text-align:center;padding:48px 20px"><div style="width:64px;height:64px;border-radius:16px;background:#f1f5f9;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div><h3 style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:8px">${title}</h3><p style="font-size:13px;color:#94a3b8">No file available.</p></div>`);
        }
        try {
          await activitiesApi.complete(aid, 'viewed');
          setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === aid ? { ...a, completion_status: 'completed' } : a) })));
        } catch { /* silent */ }
      } else if (rType === 'forum') {
        // Load forum discussions inline
        try {
          setForumLoading(true);
          const r = await forumApi.discussions(aid);
          setForumDiscussions(r.data.data ?? r.data ?? []);
        } catch { setForumDiscussions([]); }
        finally { setForumLoading(false); }
        setContentHtml('');
      } else {
        setContentHtml(`<div style="text-align:center;padding:48px 20px"><div style="width:64px;height:64px;border-radius:16px;background:#f1f5f9;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div><h3 style="font-size:16px;font-weight:600;color:#1e293b;margin-bottom:8px">${title}</h3><p style="font-size:13px;color:#64748b">This activity will open soon.</p></div>`);
      }
    } catch { setContentHtml('<p style="color:#94a3b8;text-align:center;padding:40px">Failed to load content.</p>'); }
    finally { setContentLoading(false); }
  }, [sections, setContext]);

  // Auto-open first activity when sections load
  useEffect(() => {
    if (activeActivityId && allActivities.length > 0 && !contentHtml && !videoUrl && !resourceUrl && !contentLoading && lessonPages.length === 0) {
      if (lastAutoOpenedId.current === activeActivityId) return;
      const act = allActivities.find(a => String(a.id ?? '') === activeActivityId);
      if (act) openActivity(act);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeActivityId, sections, lessonPages]);

  const goNext = () => { if (nextActivity) openActivity(nextActivity); };
  const handleMarkComplete = async () => {
    if (!activeActivityId || !selectedCourseId) return;
    try {
      await activitiesApi.complete(activeActivityId, 'manual');
      await loadSections(selectedCourseId);
    } catch { /* ignore */ }
  };

  // ─── Lesson Navigation ───────────────────────────────────────────────────
  const fetchPageChunks = async (contentId: string) => {
    setPageChunksLoading(true);
    try {
      const res = await adaptiveContentApi.chunks(contentId);
      setPageChunks(res.data?.chunks ?? []);
    } catch {
      setPageChunks([]);
    } finally {
      setPageChunksLoading(false);
    }
  };

  const goToLessonPage = async (index: number) => {
    if (index < 0 || index >= lessonPages.length) return;
    const allowSkip = navigationConfig?.lesson_page_navigation?.allow_page_skip ?? true;
    if (!allowSkip && index > currentPageIndex + 1) return;
    setCurrentPageIndex(index);
    const page = lessonPages[index];
    if (page?.id) {
      await fetchPageChunks(page.id);
      if (!page.is_viewed) {
        try {
          await lessonApi.markViewed(page.id);
          setLessonPages(prev => prev.map((p, i) => i === index ? { ...p, is_viewed: true } : p));
        } catch { /* silent */ }
      }
    }
    // Check if all pages viewed and mark activity complete
    const updatedPages = lessonPages.map((p, i) => i === index ? { ...p, is_viewed: true } : p);
    const allViewed = updatedPages.every(p => p.is_viewed);
    if (allViewed && activeActivityId) {
      try {
        await activitiesApi.complete(activeActivityId, 'viewed');
        setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === activeActivityId ? { ...a, completion_status: 'completed' } : a) })));
      } catch { /* silent */ }
    }
  };
  const goToPrevPage = () => goToLessonPage(currentPageIndex - 1);
  const goToNextPage = () => goToLessonPage(currentPageIndex + 1);

  // ─── Inline Quiz: start ─────────────────────────────────────────────────
  const handleStartQuiz = async () => {
    if (!activeActivityId) return;
    setQuizLoading(true);
    setQuizMode('running');
    setQuizSelected({});
    setQuizCurrentQ(0);
    setQuizResult(null);
    setContext({ mode: 'restricted', activityType: 'quiz' });
    procActivityId.current = activeActivityId;
    procCourseId.current   = selectedCourseId;
    try {
      const [startRes, qRes] = await Promise.all([
        quizApi.start(activeActivityId),
        quizApi.questions(activeActivityId),
      ]);
      const attemptData = startRes.data.data ?? startRes.data ?? {};
      const aid = String((attemptData as Record<string, unknown>).id ?? '');
      setQuizAttemptId(aid);
      setProcKey(`quiz:${aid}`);
      const qs: Record<string, unknown>[] = qRes.data.data ?? qRes.data ?? [];
      setQuizQuestions(qs);
      const ansMap: Record<string, unknown[]> = {};
      await Promise.all(qs.map(async (q) => {
        const qid = String(q.id ?? '');
        if (!qid) return;
        const existing = (q.answers ?? q.answers_list ?? []) as unknown[];
        if (existing.length > 0) { ansMap[qid] = existing; return; }
        const ar = await quizApi.answers(qid);
        ansMap[qid] = ar.data.data ?? ar.data ?? [];
      }));
      setQuizAnswers(ansMap);
    } catch (err: any) {
      alert('Failed to start quiz: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
      setQuizMode('idle');
    } finally { setQuizLoading(false); }
  };

  // ─── Inline Quiz: submit ────────────────────────────────────────────────
  const handleSubmitQuiz = async () => {
    if (!quizAttemptId) return;

    // Guard: require at least one answer
    const answeredCount = Object.keys(quizSelected).length;
    if (answeredCount === 0) {
      alert('Please select at least one answer before submitting.');
      return;
    }

    // Guard: confirm if not all questions answered
    if (answeredCount < quizQuestions.length) {
      const ok = window.confirm(`You have answered ${answeredCount} of ${quizQuestions.length} questions. Submit anyway?`);
      if (!ok) return;
    }

    setQuizLoading(true);
    try {
      const responses = Object.entries(quizSelected).map(([question_id, answer_id]) => ({ question_id, answer_id }));
      const r = await quizApi.submit(quizAttemptId, { responses });
      setQuizResult(r.data.data ?? r.data ?? {});
      setQuizMode('submitted');
      setProcKey(null);
      setContext({ mode: 'remediation', quizAttemptId });
      if (activeActivityId) {
        try {
          await activitiesApi.complete(activeActivityId, 'attempted');
          const _aid = activeActivityId;
          setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === _aid ? { ...a, completion_status: 'completed' } : a) })));
        } catch { /* silent */ }
      }
    } catch (err: any) {
      const data = err?.response?.data ?? {};
      const errors = data.errors ?? {};
      const errorMessages = Object.values(errors).flat().filter(Boolean);
      const mainMessage = data.message || err?.message || 'Unknown error';
      const displayMsg = errorMessages.length > 0
        ? `${mainMessage}\n\n${errorMessages.join('\n')}`
        : mainMessage;
      alert('Failed to submit quiz: ' + displayMsg);

      // If already submitted, show result and close
      if (data.data?.status === 'submitted') {
        setQuizResult(data.data);
        setQuizMode('submitted');
        setProcKey(null);
      }
    } finally { setQuizLoading(false); }
  };

  // ─── Inline Assignment: submit ──────────────────────────────────────────
  const handleSubmitAssignment = async () => {
    if (!activeActivityId) return;
    setAssignLoading(true);
    try {
      // AI content check before submitting
      const fd = new FormData();
      fd.append('submission_text', assignText);
      if (assignFile) fd.append('file', assignFile);
      if (procSessionId) {
        try {
          const afd = new FormData();
          afd.append('session_id', procSessionId);
          if (assignText.trim()) afd.append('text', assignText);
          if (assignFile) afd.append('file', assignFile);
          await proctoringApi.analyzeSubmission(afd);
        } catch { /* non-blocking */ }
      }
      await assignmentsApi.submit(activeActivityId, fd);
      setProcKey(null);
      setAssignMode('submitted');
      try {
        await activitiesApi.complete(activeActivityId, 'submitted');
        const _aid = activeActivityId;
        setSections(prev => prev.map(sec => ({ ...sec, activities: ((sec.activities ?? []) as Activity[]).map(a => String(a.id ?? '') === _aid ? { ...a, completion_status: 'completed' } : a) })));
      } catch { /* silent */ }
    } catch {
      alert('Submission failed. Please try again.');
    } finally { setAssignLoading(false); }
  };

  // Keep procForceRef up-to-date on every render so the stable callback fires
  // the correct handler depending on whether a quiz or assignment is active.
  // For quiz: the backend already marks the attempt submitted via forceSubmitAttempt,
  // so we only update UI state here (no second API call to avoid 422).
  const handleForceSubmitQuizState = () => {
    setQuizMode('submitted');
    setQuizResult(null);
    setProcKey(null);
    setContext({ mode: 'remediation', quizAttemptId });
  };
  procForceRef.current = procKey?.startsWith('quiz:')
    ? handleForceSubmitQuizState
    : handleSubmitAssignment;

  // ─── Inline Forum: load posts ───────────────────────────────────────────
  const handleLoadPosts = async (discussionId: string) => {
    if (!discussionId) return;
    setSelectedDiscussionId(discussionId);
    setForumPostsLoading(true);
    try {
      const r = await forumApi.posts(discussionId);
      setForumPosts(r.data.data ?? r.data ?? []);
    } catch { setForumPosts([]); }
    finally { setForumPostsLoading(false); }
  };

  // ─── Inline Forum: reply ──────────────────────────────────────────────────
  const handleForumReply = async () => {
    if (!selectedDiscussionId || !forumReplyText.trim()) return;
    setForumReplying(true);
    try {
      await forumApi.reply(selectedDiscussionId, { message: forumReplyText });
      setForumReplyText('');
      handleLoadPosts(selectedDiscussionId);
    } catch { alert('Failed to post reply.'); }
    finally { setForumReplying(false); }
  };

  // ─── Inline Forum: create thread ──────────────────────────────────────────
  const handleForumCreateThread = async () => {
    if (!activeActivityId || !forumNewThread.title.trim()) return;
    setForumSubmitting(true);
    try {
      const r = await forumApi.startDiscussion(activeActivityId, {
        subject: forumNewThread.title,
        message: forumNewThread.details,
        type:    forumNewThread.category,
      });
      const created = r.data.data ?? r.data;
      setForumDiscussions(prev => [created as Record<string, unknown>, ...prev]);
      setForumComposerOpen(false);
      setForumNewThread({ title: '', category: 'General', details: '' });
    } catch { alert('Failed to create thread.'); }
    finally { setForumSubmitting(false); }
  };

  if (coursesLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  const currentRawType = activeActivity ? rawTypeOf(activeActivity) : '';
  const currentStatKey = activeActivity ? statKeyOf(activeActivity) : '';

  // Video embed helper
  const renderVideo = () => {
    if (!videoUrl) return null;
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const vmMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    const embedSrc = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
      : vmMatch ? `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1` : null;
    if (videoError || !videoUrl) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6" style={{ color: "#94a3b8" }}>
          <PlayCircle size={48} className="mb-4 opacity-40" />
          <p className="text-sm font-medium">Video not available</p>
        </div>
      );
    }
    if (embedSrc) return <iframe src={embedSrc} className="w-full rounded-lg" style={{ height: "calc(100vh - 220px)", minHeight: "360px", background: "#000" }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen onError={() => setVideoError(true)} />;
    return <video src={videoUrl} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: "calc(100vh - 220px)", minHeight: "360px", background: "#000", objectFit: "contain" }} onError={() => setVideoError(true)}>Your browser does not support the video tag.</video>;
  };

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      {/* ── Proctoring hidden elements ── */}
      <video ref={procWebcamRef} autoPlay muted playsInline style={{ display: 'none' }} />
      <canvas ref={procCanvasRef} style={{ display: 'none' }} />
      <ViolationWarningModal
        violation={lastViolation}
        warningCount={procWarningCount}
        onAcknowledge={dismissViolation}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* ═══ LEFT SIDEBAR — Personalized Course Navigation ═══ */}
        {sidebarOpen && (
          <PersonalizedCourseSidebar
            sections={sections}
            sectionsLoading={sectionsLoading}
            openModules={openModules}
            activeActivityId={activeActivityId}
            navigation={navigationConfig}
            typeConfig={typeConfig}
            onToggleModule={toggleModule}
            onClose={() => setSidebarOpen(false)}
            onOpenActivity={openActivity}
            statKeyOf={statKeyOf}
            rawTypeOf={rawTypeOf}
          />
        )}

        {/* ═══ MAIN CONTENT PANEL ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>
          {/* Content top bar */}
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white border-b flex-shrink-0" style={{ borderColor: "#e2e8f0" }}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Show modules">
                <Menu size={18} color="#475569" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate" style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b" }}>{contentTitle || 'Select an activity'}</p>
              {activeSection && (
                <p className="truncate" style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {String(activeSection.title ?? activeSection.name ?? 'Module')} &bull; {activeIndex + 1} of {totalLessons}
                </p>
              )}
            </div>
            {activeActivity && currentStatKey !== 'completed' && (
              <button onClick={handleMarkComplete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:bg-green-50"
                style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", borderColor: "#bbf7d0" }}>
                <CheckCircle size={13} /> Mark Complete
              </button>
            )}
            {activeActivity && currentStatKey === 'completed' && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ fontSize: "11px", fontWeight: 600, color: "#16a34a", backgroundColor: "#f0fdf4" }}>
                <CheckCircle size={13} /> Completed
              </span>
            )}
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6" style={presentationStyles(presentationConfig)}>
              {contentLoading ? (
                <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin" style={{ color: "#2563eb" }} /></div>
              ) : !activeActivityId ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <BookMarked size={40} style={{ color: "#cbd5e1", marginBottom: 16 }} />
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#64748b" }}>Select an activity from the sidebar</p>
                  <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: 4 }}>Choose a lesson, video, quiz, or assignment to get started.</p>
                </div>
              ) : (
                <>
                  {/* Video player + personalized guide from YouTube description / transcript when available */}
                  {videoUrl && activeActivityId && (
                    <div className="mb-6 rounded-xl overflow-hidden bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <AdaptiveActivityPanel
                        activityId={activeActivityId}
                        courseId={selectedCourseId}
                        title={contentTitle}
                        presentationOverride={presentationConfig}
                      />
                      <div style={{ backgroundColor: "#000" }}>{renderVideo()}</div>
                      <VideoLearningPanel
                        activityId={activeActivityId}
                        courseId={selectedCourseId}
                        presentationConfig={presentationConfig}
                      />
                    </div>
                  )}

                  {/* ── INLINE QUIZ RUNNER ── */}
                  {currentRawType === 'quiz' && quizMode === 'idle' && contentHtml && (
                    <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                      <div className="flex justify-center mt-6">
                        <button onClick={handleStartQuiz} disabled={quizLoading}
                          className="flex items-center gap-2 px-8 py-3 rounded-xl text-white transition-all"
                          style={{ fontSize: "14px", fontWeight: 600, backgroundColor: "#7c3aed", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" }}>
                          {quizLoading ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} Start Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {currentRawType === 'quiz' && quizMode === 'running' && (
                    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      {quizLoading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin" style={{ color: "#7c3aed" }} /></div>
                      ) : quizQuestions.length === 0 ? (
                        <p className="text-center py-12" style={{ color: "#94a3b8", fontSize: "13px" }}>No questions available for this quiz.</p>
                      ) : (() => {
                        const q = quizQuestions[quizCurrentQ];
                        const qid = String(q.id ?? quizCurrentQ);
                        const qAnswersList = (quizAnswers[qid] ?? []) as Record<string, unknown>[];
                        return (
                          <>
                            <div className="px-6 pt-5 pb-3">
                              <div className="flex items-center justify-between mb-3">
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#7c3aed" }}>Question {quizCurrentQ + 1} of {quizQuestions.length}</span>
                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{Object.keys(quizSelected).length}/{quizQuestions.length} answered</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${((quizCurrentQ + 1) / quizQuestions.length) * 100}%`, backgroundColor: "#7c3aed" }} />
                              </div>
                            </div>
                            <div className="px-6 pb-4">
                              <div className="bg-violet-50 rounded-xl p-5 mb-4">
                                <p style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", lineHeight: "1.6" }}>
                                  {String(q.question_text ?? q.text ?? q.question ?? '')}
                                </p>
                              </div>
                              <div className="space-y-2.5">
                                {qAnswersList.map((ans, ai) => {
                                  const aId = String(ans.id ?? ai);
                                  const aText = String(ans.answer_text ?? ans.text ?? `Option ${ai + 1}`);
                                  const isSel = quizSelected[qid] === aId;
                                  return (
                                    <button key={aId} onClick={() => setQuizSelected(prev => ({ ...prev, [qid]: aId }))}
                                      className="w-full text-left px-4 py-3 rounded-xl border transition-all"
                                      style={{ borderColor: isSel ? "#7c3aed" : "#e2e8f0", backgroundColor: isSel ? "#f5f3ff" : "white", color: isSel ? "#6d28d9" : "#374151", fontWeight: isSel ? 600 : 400, fontSize: "13px" }}>
                                      <span className="inline-flex w-5 h-5 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 align-middle"
                                        style={{ borderColor: isSel ? "#7c3aed" : "#d1d5db", backgroundColor: isSel ? "#7c3aed" : "transparent" }}>
                                        {isSel && <span className="w-2 h-2 rounded-full bg-white" />}
                                      </span>
                                      {aText}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#f1f5f9" }}>
                              <button disabled={quizCurrentQ === 0} onClick={() => setQuizCurrentQ(q => q - 1)}
                                className="px-4 py-2 rounded-xl border disabled:opacity-40" style={{ fontSize: "13px", color: "#475569", borderColor: "#e2e8f0" }}>
                                Previous
                              </button>
                              {quizCurrentQ < quizQuestions.length - 1 ? (
                                <button onClick={() => setQuizCurrentQ(q => q + 1)}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white" style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#7c3aed" }}>
                                  Next <ChevronRight size={14} />
                                </button>
                              ) : (
                                <button onClick={handleSubmitQuiz} disabled={quizLoading}
                                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white disabled:opacity-60" style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#16a34a" }}>
                                  {quizLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />} Submit Quiz
                                </button>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {currentRawType === 'quiz' && quizMode === 'submitted' && (
                    <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#f0fdf4" }}>
                        <CheckCircle size={36} color="#16a34a" />
                      </div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Quiz Submitted!</h2>
                      {quizResult && (
                        (quizResult as Record<string, unknown>).needs_grading ? (
                          <p style={{ fontSize: "14px", color: "#f59e0b", fontWeight: 600 }}>Waiting for instructor grade</p>
                        ) : (
                          <>
                            <p style={{ fontSize: "36px", fontWeight: 700, color: Number((quizResult as Record<string, unknown>).score_percentage ?? 0) >= 70 ? "#16a34a" : "#dc2626" }}>
                              {Math.round(Number((quizResult as Record<string, unknown>).score_percentage ?? 0))}%
                            </p>
                            <p style={{ fontSize: "13px", color: "#64748b" }}>
                              {Number((quizResult as Record<string, unknown>).score_percentage ?? 0) >= 90 ? 'Excellent!' : Number((quizResult as Record<string, unknown>).score_percentage ?? 0) >= 70 ? 'Good job!' : 'Keep studying!'}
                            </p>
                          </>
                        )
                      )}
                      <button onClick={goNext} disabled={!nextActivity}
                        className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white mx-auto"
                        style={{ fontSize: "13px", fontWeight: 600, backgroundColor: nextActivity ? "#2563eb" : "#94a3b8" }}>
                        {nextActivity ? <>Continue <ArrowRight size={14} /></> : 'Completed'}
                      </button>
                    </div>
                  )}

                  {/* ── INLINE ASSIGNMENT SUBMISSION ── */}
                  {currentRawType === 'assignment' && assignMode === 'idle' && contentHtml && (
                    <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                      <div className="flex justify-center mt-6">
                        <button onClick={() => { setAssignMode('form'); procActivityId.current = activeActivityId; procCourseId.current = selectedCourseId; setProcKey(`assign:${activeActivityId}`); }}
                          className="flex items-center gap-2 px-8 py-3 rounded-xl text-white transition-all"
                          style={{ fontSize: "14px", fontWeight: 600, backgroundColor: "#f59e0b", boxShadow: "0 2px 8px rgba(245,158,11,0.3)" }}>
                          <Upload size={16} /> Submit Assignment
                        </button>
                      </div>
                    </div>
                  )}

                  {currentRawType === 'assignment' && assignMode === 'form' && (
                    <div className="bg-white rounded-xl p-6 space-y-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Submit: {contentTitle}</h3>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Your answer</label>
                        <textarea value={assignText} onChange={e => setAssignText(e.target.value)} rows={6}
                          className="w-full rounded-xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          style={{ fontSize: "13px", borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                          placeholder="Write your answer or reflection here..." />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Attach file (optional)</label>
                        <input type="file" onChange={e => setAssignFile(e.target.files?.[0] ?? null)}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {assignFile && <p className="mt-1 flex items-center gap-1" style={{ fontSize: "11px", color: "#64748b" }}><Paperclip size={10} /> {assignFile.name}</p>}
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => { setAssignMode('idle'); setProcKey(null); }} className="px-4 py-2 rounded-xl border" style={{ fontSize: "13px", color: "#475569", borderColor: "#e2e8f0" }}>Cancel</button>
                        <button onClick={handleSubmitAssignment} disabled={assignLoading || (!assignText.trim() && !assignFile)}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-white disabled:opacity-60"
                          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb" }}>
                          {assignLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Submit
                        </button>
                      </div>
                    </div>
                  )}

                  {currentRawType === 'assignment' && assignMode === 'submitted' && (
                    <div className="bg-white rounded-xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#f0fdf4" }}>
                        <CheckCircle size={36} color="#16a34a" />
                      </div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Assignment Submitted!</h2>
                      <p style={{ fontSize: "13px", color: "#64748b" }}>Your work has been submitted successfully.</p>
                      <button onClick={goNext} disabled={!nextActivity}
                        className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white mx-auto"
                        style={{ fontSize: "13px", fontWeight: 600, backgroundColor: nextActivity ? "#2563eb" : "#94a3b8" }}>
                        {nextActivity ? <>Continue <ArrowRight size={14} /></> : 'Completed'}
                      </button>
                    </div>
                  )}

                  {/* ── INLINE FORUM ── */}
                  {currentRawType === 'forum' && (
                    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      {selectedDiscussionId ? (
                        /* ── Posts view for selected discussion ── */
                        <>
                          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}>
                            <button onClick={() => { setSelectedDiscussionId(''); setForumPosts([]); }}
                              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" title="Back to discussions">
                              <ChevronRight size={16} color="#64748b" style={{ transform: 'rotate(180deg)' }} />
                            </button>
                            <span className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                              {String(forumDiscussions.find(d => String(d.id ?? '') === selectedDiscussionId)?.subject ?? 'Discussion')}
                            </span>
                          </div>
                          <div className="px-5 py-4 space-y-4" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                            {forumPostsLoading ? (
                              <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "#2563eb" }} /></div>
                            ) : forumPosts.length === 0 ? (
                              <p className="text-center" style={{ fontSize: "13px", color: "#94a3b8" }}>No replies yet. Be the first!</p>
                            ) : forumPosts.map((post, pi) => {
                              const pAuthor = String(post.user_name ?? post.author ?? 'Anonymous');
                              const pAvatar = String(post.author_avatar ?? '');
                              const pBody = String(post.message ?? post.body ?? '');
                              const pTime = String(post.created_at ?? '');
                              return (
                                <div key={pi} className="flex gap-3">
                                  {pAvatar ? (
                                    <img src={pAvatar} alt={pAuthor} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: "#2563eb" }}>
                                      {pAuthor.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{pAuthor}</span>
                                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{pTime ? new Date(pTime).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{pBody}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Reply composer */}
                          <div className="px-5 py-3 border-t" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}>
                            <div className="flex gap-2">
                              <input value={forumReplyText} onChange={e => setForumReplyText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleForumReply(); } }}
                                placeholder="Write a reply..." className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                style={{ borderColor: "#e2e8f0", backgroundColor: "white" }} />
                              <button onClick={handleForumReply} disabled={forumReplying || !forumReplyText.trim()}
                                className="px-3 py-2 rounded-xl text-white disabled:opacity-50 flex items-center gap-1"
                                style={{ backgroundColor: "#2563eb", fontSize: "12px", fontWeight: 600 }}>
                                {forumReplying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* ── Discussion list ── */
                        <>
                          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#f1f5f9" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Discussions</span>
                            <button onClick={() => setForumComposerOpen(true)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: "#2563eb" }}>
                              <Plus size={12} /> New Thread
                            </button>
                          </div>
                          <div className="px-5 py-3 border-b" style={{ borderColor: "#f1f5f9" }}>
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input value={forumSearch} onChange={e => setForumSearch(e.target.value)}
                                placeholder="Search threads..." className="w-full pl-9 pr-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                style={{ borderColor: "#e2e8f0", fontSize: "12px" }} />
                            </div>
                          </div>
                          <div style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                            {forumLoading ? (
                              <div className="flex items-center justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: "#2563eb" }} /></div>
                            ) : (() => {
                              const filtered = forumDiscussions.filter(d => {
                                const s = String(d.subject ?? d.title ?? '').toLowerCase();
                                const b = String(d.message ?? d.body ?? d.preview ?? '').toLowerCase();
                                const q = forumSearch.toLowerCase();
                                return s.includes(q) || b.includes(q);
                              });
                              if (filtered.length === 0) return (
                                <div className="text-center py-10">
                                  <MessageSquare size={28} style={{ color: "#cbd5e1", margin: "0 auto 8px" }} />
                                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>{forumSearch ? 'No threads match your search.' : 'No threads yet. Start the conversation!'}</p>
                                </div>
                              );
                              return filtered.map((thread, ti) => {
                                const tid = String(thread.id ?? ti);
                                const title = String(thread.subject ?? thread.title ?? '');
                                const preview = String(thread.message ?? thread.body ?? thread.preview ?? '');
                                const author = String(thread.user_name ?? thread.author ?? '');
                                const avatar = String(thread.author_avatar ?? '');
                                const cat = String(thread.type ?? thread.category ?? 'General');
                                const pinned = Boolean(thread.is_pinned ?? thread.pinned);
                                const replies = Number(thread.posts_count ?? thread.replies ?? 0);
                                const views = Number(thread.views ?? 0);
                                const likes = Number(thread.likes ?? 0);
                                const createdAt = String(thread.created_at ?? '');
                                const timeLabel = createdAt ? (() => { const diff = Date.now() - new Date(createdAt).getTime(); const m = Math.floor(diff / 60000); if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; })() : ''; return (
                                  <button key={tid} onClick={() => handleLoadPosts(tid)}
                                    className="w-full text-left px-5 py-3 border-b hover:bg-slate-50 transition-colors flex gap-3"
                                    style={{ borderColor: "#f8fafc" }}>
                                    {avatar ? (
                                      <img src={avatar} alt={author} className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: "#2563eb" }}>
                                        {author.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        {pinned && <Pin size={10} color="#2563eb" />}
                                        <span className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{title}</span>
                                      </div>
                                      <p className="truncate" style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.5" }}>{preview}</p>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>by <span style={{ fontWeight: 500, color: "#475569" }}>{author}</span></span>
                                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>{timeLabel}</span>
                                        <span className="flex items-center gap-0.5" style={{ fontSize: "10px", color: "#94a3b8" }}><MessageSquare size={9} /> {replies}</span>
                                        <span className="flex items-center gap-0.5" style={{ fontSize: "10px", color: "#94a3b8" }}><Eye size={9} /> {views}</span>
                                        <span className="flex items-center gap-0.5" style={{ fontSize: "10px", color: "#94a3b8" }}><ThumbsUp size={9} /> {likes}</span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              });
                            })()}
                          </div>
                          {/* New Thread Composer */}
                          {forumComposerOpen && (
                            <div className="px-5 py-4 border-t" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}>
                              <div className="space-y-3">
                                <input value={forumNewThread.title} onChange={e => setForumNewThread(prev => ({ ...prev, title: e.target.value }))}
                                  placeholder="Thread title..." className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                  style={{ borderColor: "#e2e8f0", backgroundColor: "white" }} />
                                <textarea value={forumNewThread.details} onChange={e => setForumNewThread(prev => ({ ...prev, details: e.target.value }))}
                                  rows={3} placeholder="Details & context..." className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                  style={{ borderColor: "#e2e8f0", backgroundColor: "white" }} />
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => setForumComposerOpen(false)} className="px-3 py-1.5 rounded-xl border" style={{ fontSize: "12px", color: "#475569", borderColor: "#e2e8f0" }}>Cancel</button>
                                  <button onClick={handleForumCreateThread} disabled={forumSubmitting || !forumNewThread.title.trim()}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white disabled:opacity-60" style={{ fontSize: "12px", fontWeight: 600, backgroundColor: "#2563eb" }}>
                                    {forumSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Publish
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* ── FILE VIEWER ── */}
                  {currentRawType === 'file' && resourceUrl && (() => {
                    const rawExt = (resourceUrl.split('?')[0].split('#')[0].split('.').pop() ?? '').toLowerCase();
                    const mime = fileMimeType.toLowerCase();
                    const isVideo = mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'm4v', 'wmv', 'flv'].includes(rawExt);
                    const isAudio = !isVideo && (mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'm4a', 'flac', 'oga', 'opus'].includes(rawExt));
                    const isImage = !isVideo && !isAudio && (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(rawExt));
                    const isPdf = mime === 'application/pdf' || rawExt === 'pdf';
                    const isOffice = !isPdf && (['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'odp', 'ods'].includes(rawExt) || mime.includes('officedocument') || mime.includes('ms-powerpoint') || mime.includes('ms-excel') || mime.includes('msword'));
                    const needsDocViewer = isPdf || isOffice;
                    const docViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resourceUrl)}&embedded=true`;
                    return (
                      <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        <AdaptiveActivityPanel
                          activityId={activeActivityId}
                          courseId={selectedCourseId}
                          title={contentTitle}
                          presentationOverride={presentationConfig}
                        />
                        {isVideo && (
                          <video controls className="w-full rounded-xl" style={{ maxHeight: "calc(100vh - 260px)", minHeight: "200px", display: "block" }}>
                            <source src={resourceUrl} type={fileMimeType || undefined} />
                            <p className="text-sm text-gray-500 p-4">Your browser does not support this video format.</p>
                          </video>
                        )}
                        {isAudio && (
                          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><File size={32} style={{ color: "#2563eb" }} /></div>
                            <p className="text-base font-semibold text-gray-900 mb-6">{contentTitle}</p>
                            <audio controls className="w-full max-w-md mb-4">
                              <source src={resourceUrl} type={fileMimeType || undefined} />
                            </audio>
                            <a href={resourceUrl} download className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"><Download size={14} /> Download</a>
                          </div>
                        )}
                        {isImage && (
                          <div className="flex flex-col items-center p-4" style={{ backgroundColor: "#f8fafc" }}>
                            <img src={resourceUrl} alt={contentTitle} className="max-w-full rounded-lg" style={{ maxHeight: "calc(100vh - 300px)", objectFit: "contain" }} />
                            <div className="mt-3 flex gap-4">
                              <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"><ExternalLink size={14} /> Open full size</a>
                              <a href={resourceUrl} download className="text-sm text-gray-600 hover:underline inline-flex items-center gap-1"><Download size={14} /> Download</a>
                            </div>
                          </div>
                        )}
                        {needsDocViewer && (
                          <iframe src={docViewerUrl} className="w-full" style={{ height: "calc(100vh - 260px)", minHeight: "400px", border: "none" }} title={contentTitle} allow="fullscreen" />
                        )}
                        {!isVideo && !isAudio && !isImage && !needsDocViewer && (
                          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><File size={32} style={{ color: "#2563eb" }} /></div>
                            <p className="text-base font-semibold text-gray-900 mb-1">{contentTitle}</p>
                            <p className="text-sm text-gray-500 mb-6">Click below to open or download this file.</p>
                            <div className="flex flex-wrap justify-center gap-3">
                              <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:opacity-90" style={{ backgroundColor: "#2563eb", fontSize: "14px" }}><ExternalLink size={16} /> Open in New Tab</a>
                              <a href={resourceUrl} download className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border transition-all hover:bg-gray-50" style={{ color: "#374151", borderColor: "#d1d5db", fontSize: "14px" }}><Download size={16} /> Download</a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* ── MULTI-PAGE LESSON VIEWER ── */}
                  {(currentRawType === 'page' || currentRawType === 'lesson') && lessonPages.length > 0 && (
                    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      {/* Page list / progress header */}
                      <div className="px-5 py-3 border-b" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                            Page {currentPageIndex + 1} of {lessonPages.length}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>
                            {lessonPages.filter(p => p.is_viewed).length}/{lessonPages.length} viewed
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {lessonPages.map((p, i) => (
                            <button
                              key={p.id ?? i}
                              onClick={() => goToLessonPage(i)}
                              className="flex-1 h-1.5 rounded-full transition-colors"
                              style={{
                                backgroundColor: i === currentPageIndex ? "#2563eb" : p.is_viewed ? "#22c55e" : "#e2e8f0",
                              }}
                              title={p.title ?? `Page ${i + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Current page content */}
                      <div className="px-6 py-5">
                        {lessonPagesLoading || pageChunksLoading ? (
                          <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#2563eb" }} /></div>
                        ) : pageChunks.length > 0 ? (
                          <>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                              {lessonPages[currentPageIndex]?.title ?? 'Page'}
                            </h2>
                            <div className="space-y-4">
                              {pageChunks.map((chunk) => (
                                <AdaptiveContentBlock
                                  key={chunk.id}
                                  courseId={selectedCourseId}
                                  chunkId={chunk.id}
                                  presentationOverride={presentationConfig}
                                />
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                              {lessonPages[currentPageIndex]?.title ?? 'Page'}
                            </h2>
                            <div
                              className="prose prose-slate max-w-none"
                              dangerouslySetInnerHTML={{ __html: lessonPages[currentPageIndex]?.content ?? '' }}
                            />
                          </>
                        )}
                      </div>

                      {/* Navigation footer */}
                      <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "#f1f5f9" }}>
                        <button
                          disabled={currentPageIndex === 0}
                          onClick={goToPrevPage}
                          className="px-4 py-2 rounded-xl border disabled:opacity-40 transition-colors"
                          style={{ fontSize: "13px", color: "#475569", borderColor: "#e2e8f0" }}
                        >
                          ← Previous
                        </button>
                        <div className="flex gap-1">
                          {lessonPages.map((p, i) => {
                            const allowSkip = navigationConfig?.lesson_page_navigation?.allow_page_skip ?? true;
                            const isFuture = i > currentPageIndex + 1;
                            const pageDisabled = !allowSkip && isFuture;
                            return (
                            <button
                              key={p.id ?? i}
                              disabled={pageDisabled}
                              onClick={() => goToLessonPage(i)}
                              className="w-7 h-7 rounded-lg text-xs font-medium transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: i === currentPageIndex ? "#eff6ff" : "transparent",
                                color: i === currentPageIndex ? "#2563eb" : p.is_viewed ? "#22c55e" : "#94a3b8",
                                border: i === currentPageIndex ? "1px solid #bfdbfe" : "1px solid transparent",
                              }}
                            >
                              {p.is_viewed && i !== currentPageIndex ? <CheckCircle size={14} /> : i + 1}
                            </button>
                            );
                          })}
                        </div>
                        {currentPageIndex < lessonPages.length - 1 ? (
                          <button
                            onClick={goToNextPage}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white"
                            style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb" }}
                          >
                            Next →
                          </button>
                        ) : (
                          <button
                            onClick={goNext}
                            disabled={!nextActivity}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60"
                            style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#16a34a" }}
                          >
                            {nextActivity ? <>Finish <ArrowRight size={14} /></> : 'Completed'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {currentRawType === 'file' && !resourceUrl && contentHtml && (
                    <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                    </div>
                  )}

                  {/* ── OTHER CONTENT (url, fallback) ── */}
                  {currentRawType !== 'quiz' && currentRawType !== 'assignment' && currentRawType !== 'forum' && currentRawType !== 'file' && currentRawType !== 'page' && currentRawType !== 'lesson' && contentHtml && (
                    <div className="bg-white rounded-xl p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM PROGRESS / ACTION BAR ═══ */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-t flex-shrink-0" style={{ borderColor: "#e2e8f0", boxShadow: "0 -1px 4px rgba(0,0,0,0.05)" }}>
        {/* Course progress */}
        {(() => {
          const sel = enrolledCourses.find((e: any) => String((e.course ?? e).id ?? '') === selectedCourseId);
          const course = (sel?.course ?? sel ?? {}) as Course;
          const cname = String(course.name ?? course.title ?? 'Course');
          return (
            <div className="flex items-center gap-3 min-w-0" style={{ maxWidth: "320px" }}>
              <div className="flex items-center gap-2 min-w-0">
                <BookMarked size={14} color="#2563eb" />
                <span className="truncate" style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                  {cname}
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: pct === 100 ? "#16a34a" : "#2563eb", whiteSpace: "nowrap" }}>{pct}%</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#e2e8f0", minWidth: 60 }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#22c55e" : "#2563eb" }} />
              </div>
            </div>
          );
        })()}

        {/* Center info */}
        <div className="hidden md:flex items-center gap-3">
          <span style={{ fontSize: "12px", color: "#64748b" }}>{completedLessons}/{totalLessons} activities completed</span>
        </div>

        {/* Next button */}
        <button
          disabled={!nextActivity}
          onClick={goNext}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-white transition-all"
          style={{
            fontSize: "13px", fontWeight: 600,
            backgroundColor: nextActivity ? "#2563eb" : "#94a3b8",
            opacity: nextActivity ? 1 : 0.5,
            cursor: nextActivity ? "pointer" : "not-allowed",
            boxShadow: nextActivity ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
          }}
        >
          Next <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
