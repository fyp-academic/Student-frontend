import { useState } from "react";
import { Heart, MessageCircle, Share2, Bookmark, Pin, FileText, Video, Bell, BookOpen, Radio } from "lucide-react";

const courses = [
  "All Courses",
  "CS301 - Data Science",
  "MATH402 - Calculus",
  "BIO301 - Biology",
  "CS450 - AI & ML",
  "IDIT205 - Learning Design",
];

type PostType = "announcement" | "material" | "video" | "assignment" | "reminder" | "live";

interface Post {
  id: number;
  course: string;
  courseColor: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  type: PostType;
  title: string;
  content: string;
  likes: number;
  comments: number;
  pinned?: boolean;
  startTime?: string;
  endTime?: string;
  joinLink?: string;
}

const feedPosts: Post[] = [
  {
    id: 1, course: "CS301", courseColor: "#2563eb", author: "Dr. Sarah Chen", role: "Instructor",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "2 hours ago", type: "announcement", pinned: true,
    title: "📢 Midterm Exam Schedule Updated",
    content: "The midterm exam has been rescheduled to March 10, 2026. The exam will cover Modules 1-6 including data cleaning, visualization, and basic ML. Please review the updated study guide posted in the materials section.",
    likes: 42, comments: 18,
  },
  {
    id: 2, course: "MATH402", courseColor: "#7c3aed", author: "Prof. John Miller", role: "Instructor",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "5 hours ago", type: "material",
    title: "📄 New Lecture Notes: Series & Sequences",
    content: "Chapter 8 lecture notes are now available. These cover convergence tests, power series, and Taylor expansions. The PDF includes practice problems with solutions. Office hours extended to Wednesday 3-5pm this week.",
    likes: 28, comments: 7,
  },
  {
    id: 3, course: "CS450", courseColor: "#0891b2", author: "Dr. James Liu", role: "Instructor",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "1 day ago", type: "video",
    title: "🎥 Video Lecture: Introduction to Neural Networks",
    content: "This week's video lecture on neural network architecture is now live. Duration: 45 minutes. Topics covered: perceptrons, activation functions, backpropagation, and gradient descent. Don't forget to complete the in-video quizzes!",
    likes: 65, comments: 23,
  },
  {
    id: 4, course: "BIO301", courseColor: "#059669", author: "Dr. Emily Ross", role: "Instructor",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "2 days ago", type: "assignment",
    title: "📝 Assignment 4 Released: Cell Division Report",
    content: "Lab Report Assignment 4 is now available. You need to document your observations from last week's mitosis lab experiment. Include diagrams, data tables, and your analysis. Due date: March 1, 2026.",
    likes: 19, comments: 11,
  },
  {
    id: 5, course: "CS301", courseColor: "#2563eb", author: "Dr. Sarah Chen", role: "Instructor",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "3 days ago", type: "reminder",
    title: "⏰ Reminder: Assignment 3 Due Tomorrow",
    content: "Just a reminder that Assignment 3 (Pandas DataFrames) is due tomorrow February 25 at 11:59 PM. Make sure to submit through the portal. Late submissions will incur a 10% penalty per day.",
    likes: 34, comments: 5,
  },
  {
    id: 6,
    course: "IDIT205",
    courseColor: "#0f766e",
    author: "Adelfina Mambali",
    role: "Facilitator",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Starting soon",
    type: "live",
    title: "🔴 Live Session: Adaptive Storyboarding Lab",
    content: "We’re going hands-on with scenario-based learning flows. Bring your draft storyboards for immediate feedback and AI co-design tips.",
    likes: 12,
    comments: 4,
    startTime: "Today · 19:30",
    endTime: "21:00",
    joinLink: "#",
  },
];

const typeConfig: Record<PostType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  announcement: { icon: Bell, color: "#dc2626", bg: "#fef2f2", label: "Announcement" },
  material: { icon: FileText, color: "#2563eb", bg: "#eff6ff", label: "New Material" },
  video: { icon: Video, color: "#7c3aed", bg: "#fdf4ff", label: "Video Lecture" },
  assignment: { icon: BookOpen, color: "#f59e0b", bg: "#fffbeb", label: "Assignment" },
  reminder: { icon: Bell, color: "#f59e0b", bg: "#fffbeb", label: "Reminder" },
  live: { icon: Radio, color: "#0f766e", bg: "#ecfdf5", label: "Live Session" },
};

export function CourseFeed() {
  const [selectedCourse, setSelectedCourse] = useState("All Courses");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<number>>(new Set());

  const filtered = selectedCourse === "All Courses"
    ? feedPosts
    : feedPosts.filter((p) => p.course === selectedCourse.split(" ")[0]);

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSave = (id: number) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Course Feed</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Latest updates from your enrolled courses
        </p>
      </div>

      {/* Course Filter */}
      <div className="flex gap-2 flex-wrap">
        {courses.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCourse(c)}
            className="px-3 py-1.5 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: selectedCourse === c ? 600 : 400,
              backgroundColor: selectedCourse === c ? "#2563eb" : "white",
              color: selectedCourse === c ? "white" : "#475569",
              borderColor: selectedCourse === c ? "#2563eb" : "#e2e8f0",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post) => {
          const TypeIcon = typeConfig[post.type];
          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                borderLeft: post.pinned ? "3px solid #2563eb" : "none",
              }}
            >
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full object-cover" />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ backgroundColor: post.courseColor }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{post.author}</span>
                        <span
                          className="px-2 py-0.5 rounded-md"
                          style={{ fontSize: "10px", backgroundColor: `${post.courseColor}15`, color: post.courseColor, fontWeight: 600 }}
                        >
                          {post.course}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{post.role} · {post.time}</span>
                        {post.pinned && (
                          <span className="flex items-center gap-0.5" style={{ fontSize: "10px", color: "#2563eb" }}>
                            <Pin size={10} /> Pinned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ fontSize: "11px", fontWeight: 600, backgroundColor: TypeIcon.bg, color: TypeIcon.color }}
                  >
                    <TypeIcon.icon size={11} />
                    {TypeIcon.label}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-4">
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  {post.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.6" }}>
                  {post.content}
                </p>

                {post.type === "live" && (
                  <div
                    className="mt-4 p-3 rounded-2xl border flex flex-wrap items-center gap-3"
                    style={{ borderColor: "#a7f3d0", backgroundColor: "#ecfdf5" }}
                  >
                    <div className="flex flex-col" style={{ fontSize: "12px", color: "#065f46" }}>
                      <span style={{ fontWeight: 700 }}>Live from {post.startTime}</span>
                      <span style={{ color: "#065f46", opacity: 0.8 }}>Ends {post.endTime}</span>
                    </div>
                    <button
                      className="ml-auto px-4 py-2 rounded-full text-white font-semibold flex items-center gap-1 animate-pulse"
                      style={{ background: "linear-gradient(135deg, #047857, #0d9488)", fontSize: "12px" }}
                    >
                      Join Session
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 transition-colors"
                    style={{ fontSize: "12px", color: likedPosts.has(post.id) ? "#ef4444" : "#64748b" }}
                  >
                    <Heart size={15} fill={likedPosts.has(post.id) ? "#ef4444" : "none"} />
                    {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors" style={{ fontSize: "12px" }}>
                    <MessageCircle size={15} />
                    {post.comments}
                  </button>
                  <button className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors" style={{ fontSize: "12px" }}>
                    <Share2 size={15} />
                    Share
                  </button>
                  <button
                    onClick={() => toggleSave(post.id)}
                    className="ml-auto transition-colors"
                    style={{ color: savedPosts.has(post.id) ? "#2563eb" : "#94a3b8" }}
                  >
                    <Bookmark size={15} fill={savedPosts.has(post.id) ? "#2563eb" : "none"} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
