import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ThumbsUp, Eye, Clock, Plus, Search, Pin, CheckCircle, X, Loader2 } from "lucide-react";
import { coursesApi, activitiesApi, forumApi } from "../services/api";

type Thread = Record<string, unknown>;
type CourseItem = Record<string, unknown>;
type ForumActivity = Record<string, unknown>;

const STATIC_CATEGORIES = ["All Topics", "General", "Q&A", "Study Groups", "Projects", "Announcements"];

const catColors: Record<string, { bg: string; text: string }> = {
  Announcements: { bg: "#fef2f2", text: "#dc2626" },
  "Q&A":         { bg: "#eff6ff", text: "#2563eb" },
  "Study Groups": { bg: "#f0fdf4", text: "#16a34a" },
  Projects:      { bg: "#fdf4ff", text: "#9333ea" },
  General:       { bg: "#f8fafc", text: "#475569" },
};

function timeAgo(d: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function CourseForum() {
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [search, setSearch]                 = useState("");
  const [showComposer, setShowComposer]     = useState(false);
  const [newThread, setNewThread]           = useState({ title: "", category: "General", details: "" });
  const [submitting, setSubmitting]         = useState(false);

  const [enrolledCourses, setEnrolledCourses]   = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse]     = useState<string>("");
  const [forumActivities, setForumActivities]   = useState<ForumActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [threads, setThreads]                   = useState<Thread[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [threadsLoading, setThreadsLoading]     = useState(false);

  // Load enrolled courses on mount
  useEffect(() => {
    coursesApi.myCourses().then(r => {
      const items: CourseItem[] = r.data.data ?? r.data ?? [];
      setEnrolledCourses(items);
      if (items.length > 0) setSelectedCourse(String(items[0].id ?? ''));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // When course changes: load sections → forum activities
  useEffect(() => {
    if (!selectedCourse) return;
    setForumActivities([]);
    setThreads([]);
    setSelectedActivity('');
    coursesApi.sections(selectedCourse).then(async r => {
      const sections: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      const allActivities: ForumActivity[] = [];
      await Promise.all(sections.map(async (sec) => {
        const secId = String(sec.id ?? '');
        if (!secId) return;
        const ar = await activitiesApi.list(secId);
        const acts: Record<string, unknown>[] = ar.data.data ?? ar.data ?? [];
        const forums = acts.filter(a => String(a.type ?? a.activity_type ?? '').toLowerCase().includes('forum'));
        allActivities.push(...forums);
      }));
      setForumActivities(allActivities);
      if (allActivities.length > 0) setSelectedActivity(String(allActivities[0].id ?? ''));
    }).catch(() => {});
  }, [selectedCourse]);

  // When forum activity changes: load threads/discussions
  const loadThreads = useCallback((activityId: string) => {
    if (!activityId) return;
    setThreadsLoading(true);
    forumApi.discussions(activityId).then(r => {
      setThreads(r.data.data ?? r.data ?? []);
    }).catch(() => {}).finally(() => setThreadsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedActivity) loadThreads(selectedActivity);
  }, [selectedActivity, loadThreads]);

  const handlePublish = async () => {
    if (!newThread.title.trim() || !selectedActivity) return;
    setSubmitting(true);
    try {
      const r = await forumApi.startDiscussion(selectedActivity, {
        subject: newThread.title,
        message: newThread.details,
        type:    newThread.category,
      });
      const created = r.data.data ?? r.data;
      setThreads(prev => [created as Thread, ...prev]);
      setShowComposer(false);
      setNewThread({ title: '', category: 'General', details: '' });
    } catch { /* ignore */ } finally {
      setSubmitting(false);
    }
  };

  const filtered = threads.filter((t) => {
    const cat     = String(t.type ?? t.category ?? '');
    const title   = String(t.subject ?? t.title ?? '');
    const preview = String(t.message ?? t.body ?? t.preview ?? '');
    const matchesCat    = activeCategory === "All Topics" || cat === activeCategory;
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) ||
                          preview.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Course Forum</h1>
          <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
            Discuss, ask questions, and collaborate with peers
          </p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          disabled={!selectedActivity}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
        >
          <Plus size={15} />
          New Thread
        </button>
      </div>

      {/* Course + Forum Activity selectors */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
          className="px-3 py-2 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ borderColor: "#e2e8f0", color: "#1e293b" }}
        >
          {enrolledCourses.length === 0 && <option value="">No enrolled courses</option>}
          {enrolledCourses.map((c, i) => (
            <option key={String(c.id ?? i)} value={String(c.id ?? i)}>
              {String(c.short_name ?? c.shortName ?? '')} — {String(c.title ?? c.name ?? '')}
            </option>
          ))}
        </select>
        {forumActivities.length > 1 && (
          <select
            value={selectedActivity}
            onChange={e => setSelectedActivity(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ borderColor: "#e2e8f0", color: "#1e293b" }}
          >
            {forumActivities.map((a, i) => (
              <option key={String(a.id ?? i)} value={String(a.id ?? i)}>
                {String(a.name ?? a.title ?? `Forum ${i + 1}`)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search forum threads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          style={{ fontSize: "13px", borderColor: "#e2e8f0" }}
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {STATIC_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3.5 py-1.5 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeCategory === cat ? 600 : 400,
              backgroundColor: activeCategory === cat ? "#1e3a8a" : "white",
              color: activeCategory === cat ? "white" : "#475569",
              borderColor: activeCategory === cat ? "#1e3a8a" : "#e2e8f0",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread List */}
      {threadsLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={22} className="animate-spin" style={{ color: "#2563eb" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <MessageSquare size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            {enrolledCourses.length === 0 ? "Enroll in a course to see its forum." : forumActivities.length === 0 ? "No forum activity found for this course." : "No threads yet. Start the conversation!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((thread, idx) => {
            const tid      = String(thread.id ?? idx);
            const title    = String(thread.subject ?? thread.title ?? '');
            const preview  = String(thread.message ?? thread.body ?? thread.preview ?? '');
            const author   = String(thread.user_name ?? thread.author ?? '');
            const authorRole = String(thread.author_role ?? thread.authorRole ?? '');
            const avatar   = String(thread.author_avatar ?? thread.avatar ?? '');
            const cat      = String(thread.type ?? thread.category ?? 'General');
            const course   = String(thread.course_code ?? thread.course ?? '');
            const pinned   = Boolean(thread.is_pinned ?? thread.pinned);
            const resolved = Boolean(thread.is_resolved ?? thread.resolved);
            const replies  = Number(thread.posts_count ?? thread.replies ?? 0);
            const views    = Number(thread.views ?? 0);
            const likes    = Number(thread.likes ?? 0);
            const createdAt = String(thread.created_at ?? thread.time ?? '');
            const timeLabel = createdAt ? timeAgo(createdAt) : '';
            const catStyle  = catColors[cat] ?? catColors.General;

            return (
              <div
                key={tid}
                className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: pinned ? "3px solid #2563eb" : "none" }}
              >
                <div className="flex items-start gap-4">
                  {avatar ? (
                    <img src={avatar} alt={author} className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#2563eb" }}>
                      {author.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {pinned && <span className="flex items-center gap-0.5 text-blue-600" style={{ fontSize: "10px", fontWeight: 600 }}><Pin size={10} /> Pinned</span>}
                      {resolved && <span className="flex items-center gap-0.5 text-green-600" style={{ fontSize: "10px", fontWeight: 600 }}><CheckCircle size={10} /> Resolved</span>}
                      <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", fontWeight: 600, ...catStyle }}>{cat}</span>
                      {course && <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>{course}</span>}
                    </div>
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>{title}</h3>
                    <p className="line-clamp-2" style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>{preview}</p>
                    <div className="flex items-center gap-4 mt-2.5">
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                        by <span style={{ fontWeight: 500, color: "#475569" }}>{author}</span>
                        {authorRole.toLowerCase() === "instructor" && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-blue-600" style={{ fontSize: "9px", fontWeight: 700, backgroundColor: "#eff6ff" }}>INSTRUCTOR</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}><Clock size={11} />{timeLabel}</div>
                      <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}><MessageSquare size={11} />{replies}</div>
                      <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}><Eye size={11} />{views}</div>
                      <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}><ThumbsUp size={11} />{likes}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowComposer(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 space-y-4" style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Start a new thread</p>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Share a question, idea, or study invite with your cohort.</p>
              </div>
              <button onClick={() => setShowComposer(false)} className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Thread title</label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-2xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: "#e2e8f0", fontSize: "13px" }}
                  placeholder="e.g. Need clarity on gradient descent intuition?"
                />
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Category</label>
                <div className="flex gap-2 flex-wrap">
                  {STATIC_CATEGORIES.filter(c => c !== "All Topics").map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewThread(prev => ({ ...prev, category: cat }))}
                      className="px-3 py-1.5 rounded-xl border transition-all"
                      style={{ fontSize: "11px", fontWeight: newThread.category === cat ? 600 : 500,
                        backgroundColor: newThread.category === cat ? "#2563eb" : "white",
                        color: newThread.category === cat ? "white" : "#475569",
                        borderColor: newThread.category === cat ? "#2563eb" : "#e2e8f0" }}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Details & context</label>
                <textarea
                  value={newThread.details}
                  onChange={(e) => setNewThread(prev => ({ ...prev, details: e.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: "#e2e8f0", fontSize: "12px", backgroundColor: "#f8fafc" }}
                  placeholder="Share what you've tried, links, or what kind of support you're after."
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-slate-500" style={{ fontSize: "12px" }}>
                <input type="checkbox" className="rounded border-slate-300" />
                Notify me about replies
              </label>
              <div className="flex gap-2">
                <button onClick={() => setShowComposer(false)} className="px-4 py-2 rounded-xl border text-slate-600" style={{ fontSize: "12px", borderColor: "#e2e8f0" }}>Cancel</button>
                <button
                  disabled={!newThread.title.trim() || submitting}
                  onClick={handlePublish}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white disabled:opacity-60"
                  style={{ fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
                  Publish Thread
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
