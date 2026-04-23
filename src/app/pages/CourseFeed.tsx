import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Pin, FileText, Video, Bell, BookOpen, Radio, Loader2 } from "lucide-react";
import { coursesApi, dashboardApi } from "../services/api";

type CourseItem = Record<string, unknown>;
type FeedPost   = Record<string, unknown>;

type PostType = "announcement" | "material" | "video" | "assignment" | "reminder" | "live" | "general";

const COURSE_COLORS = ["#2563eb","#0891b2","#7c3aed","#059669","#dc2626","#f59e0b","#0f766e","#be185d"];

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  announcement: { icon: Bell,     color: "#dc2626", bg: "#fef2f2", label: "Announcement" },
  material:     { icon: FileText, color: "#2563eb", bg: "#eff6ff", label: "New Material"  },
  video:        { icon: Video,    color: "#7c3aed", bg: "#fdf4ff", label: "Video Lecture" },
  assignment:   { icon: BookOpen, color: "#f59e0b", bg: "#fffbeb", label: "Assignment"    },
  reminder:     { icon: Bell,     color: "#f59e0b", bg: "#fffbeb", label: "Reminder"      },
  live:         { icon: Radio,    color: "#0f766e", bg: "#ecfdf5", label: "Live Session"  },
  general:      { icon: MessageCircle, color: "#475569", bg: "#f8fafc", label: "Update"   },
};

const fallbackType = typeConfig.general;

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CourseFeed() {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [likedPosts, setLikedPosts]   = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts]   = useState<Set<string>>(new Set());
  const [enrolledCourses, setEnrolledCourses] = useState<CourseItem[]>([]);
  const [feedPosts, setFeedPosts]     = useState<FeedPost[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.myCourses(),
      dashboardApi.studentHub(),
    ]).then(([cRes, hubRes]) => {
      const courses: CourseItem[] = cRes.data.data ?? cRes.data ?? [];
      setEnrolledCourses(courses);
      const hub: Record<string, unknown> = hubRes.data.data ?? hubRes.data ?? {};
      const activity: FeedPost[] = (hub.recent_activity ?? hub.announcements ?? hub.feed ?? []) as FeedPost[];
      setFeedPosts(activity);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = selectedCourse === "all"
    ? feedPosts
    : feedPosts.filter(p => String(p.course_id ?? p.course) === selectedCourse);

  const toggleLike = (id: string) => {
    setLikedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleSave = (id: string) => {
    setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Course Feed</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Latest updates from your enrolled courses
        </p>
      </div>

      {/* Course Filter — from enrolled courses */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCourse("all")}
          className="px-3 py-1.5 rounded-xl border transition-all"
          style={{ fontSize: "12px", fontWeight: selectedCourse === "all" ? 600 : 400,
            backgroundColor: selectedCourse === "all" ? "#2563eb" : "white",
            color: selectedCourse === "all" ? "white" : "#475569",
            borderColor: selectedCourse === "all" ? "#2563eb" : "#e2e8f0" }}
        >
          All Courses
        </button>
        {enrolledCourses.map((c, idx) => {
          const cid   = String(c.id ?? idx);
          const code  = String(c.short_name ?? c.shortName ?? c.code ?? "");
          const name  = String(c.title ?? c.name ?? "");
          const label = code ? `${code} - ${name}` : name;
          return (
            <button
              key={cid}
              onClick={() => setSelectedCourse(cid)}
              className="px-3 py-1.5 rounded-xl border transition-all"
              style={{ fontSize: "12px", fontWeight: selectedCourse === cid ? 600 : 400,
                backgroundColor: selectedCourse === cid ? "#2563eb" : "white",
                color: selectedCourse === cid ? "white" : "#475569",
                borderColor: selectedCourse === cid ? "#2563eb" : "#e2e8f0" }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <Bell size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No updates yet from your enrolled courses.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, idx) => {
            const id         = String(post.id ?? idx);
            const postType   = String(post.type ?? post.activity_type ?? "general") as PostType;
            const TypeCfg    = typeConfig[postType] ?? fallbackType;
            const author     = String(post.author ?? post.user_name ?? post.author_name ?? "");
            const role       = String(post.role ?? post.author_role ?? "");
            const avatar     = String(post.avatar ?? post.author_avatar ?? "");
            const courseCode = String(post.course ?? post.course_code ?? "");
            const courseColor = COURSE_COLORS[idx % COURSE_COLORS.length];
            const title      = String(post.title ?? post.subject ?? "");
            const content    = String(post.content ?? post.message ?? post.body ?? "");
            const likes      = Number(post.likes ?? post.reactions_count ?? 0);
            const comments   = Number(post.comments ?? post.replies_count ?? post.posts_count ?? 0);
            const pinned     = Boolean(post.pinned ?? post.is_pinned);
            const createdAt  = String(post.created_at ?? post.time ?? "");
            const timeLabel  = createdAt ? timeAgo(createdAt) : String(post.time ?? "");
            const isLiked    = likedPosts.has(id);
            const isSaved    = savedPosts.has(id);

            return (
              <div
                key={id}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: pinned ? "3px solid #2563eb" : "none" }}
              >
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {avatar ? (
                          <img src={avatar} alt={author} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: courseColor }}>
                            {author.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white" style={{ backgroundColor: courseColor }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{author}</span>
                          {courseCode && (
                            <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", backgroundColor: `${courseColor}18`, color: courseColor, fontWeight: 600 }}>
                              {courseCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{role}{role && timeLabel ? " · " : ""}{timeLabel}</span>
                          {pinned && (
                            <span className="flex items-center gap-0.5" style={{ fontSize: "10px", color: "#2563eb" }}>
                              <Pin size={10} /> Pinned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg flex-shrink-0" style={{ fontSize: "11px", fontWeight: 600, backgroundColor: TypeCfg.bg, color: TypeCfg.color }}>
                      <TypeCfg.icon size={11} />
                      {TypeCfg.label}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>{title}</h3>
                  <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>{content}</p>

                  {postType === "live" && (
                    <div className="mt-4 p-3 rounded-2xl border flex flex-wrap items-center gap-3" style={{ borderColor: "#a7f3d0", backgroundColor: "#ecfdf5" }}>
                      <div className="flex flex-col" style={{ fontSize: "12px", color: "#065f46" }}>
                        <span style={{ fontWeight: 700 }}>{String(post.start_time ?? post.startTime ?? "Starting soon")}</span>
                      </div>
                      {!!(post.join_link ?? post.joinLink) && (
                        <a href={String(post.join_link ?? post.joinLink ?? "#")} target="_blank" rel="noreferrer"
                          className="ml-auto px-4 py-2 rounded-full text-white font-semibold flex items-center gap-1"
                          style={{ background: "linear-gradient(135deg, #047857, #0d9488)", fontSize: "12px" }}
                        >
                          Join Session
                        </a>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                    <button onClick={() => toggleLike(id)} className="flex items-center gap-1.5 transition-colors" style={{ fontSize: "12px", color: isLiked ? "#ef4444" : "#64748b" }}>
                      <Heart size={15} fill={isLiked ? "#ef4444" : "none"} />
                      {likes + (isLiked ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors" style={{ fontSize: "12px" }}>
                      <MessageCircle size={15} /> {comments}
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors" style={{ fontSize: "12px" }}>
                      <Share2 size={15} /> Share
                    </button>
                    <button onClick={() => toggleSave(id)} className="ml-auto transition-colors" style={{ color: isSaved ? "#2563eb" : "#94a3b8" }}>
                      <Bookmark size={15} fill={isSaved ? "#2563eb" : "none"} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
