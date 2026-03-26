import { useState } from "react";
import { MessageSquare, ThumbsUp, Eye, Clock, Plus, Search, Pin, CheckCircle, X } from "lucide-react";

const categories = ["All Topics", "General", "Q&A", "Study Groups", "Projects", "Announcements"];

const threads = [
  {
    id: 1, pinned: true, resolved: false,
    category: "Announcements",
    title: "Welcome to CS301 — Course Guidelines & Resources",
    author: "Dr. Sarah Chen", authorRole: "Instructor", course: "CS301",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Jan 15, 2026", replies: 24, views: 342, likes: 56,
    preview: "Hello everyone! Welcome to Data Science Fundamentals. Please read through the course syllabus attached and introduce yourself in the replies...",
  },
  {
    id: 2, pinned: false, resolved: true,
    category: "Q&A",
    title: "How to handle NaN values in Pandas DataFrames?",
    author: "Alex Masud", authorRole: "Student", course: "CS301",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Feb 20, 2026", replies: 8, views: 127, likes: 19,
    preview: "I'm working on Assignment 3 and having trouble deciding when to use dropna() vs fillna(). Can someone clarify the best practices?",
  },
  {
    id: 3, pinned: false, resolved: false,
    category: "Study Groups",
    title: "Study group for MATH402 midterm — Saturday Feb 28",
    author: "Jamie Park", authorRole: "Student", course: "MATH402",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Feb 22, 2026", replies: 15, views: 98, likes: 31,
    preview: "Looking for students to form a study group for the upcoming midterm. Planning to meet Saturday afternoon in the library. Topics: Chapters 5-8...",
  },
  {
    id: 4, pinned: false, resolved: true,
    category: "Q&A",
    title: "Confused about gradient descent — can someone explain?",
    author: "Sam Rivera", authorRole: "Student", course: "CS450",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Feb 18, 2026", replies: 12, views: 203, likes: 44,
    preview: "I watched the lecture twice but still don't fully understand how gradient descent updates weights. Is there a simpler intuition?",
  },
  {
    id: 5, pinned: false, resolved: false,
    category: "Projects",
    title: "CS201 Final Project — Partner Request Thread",
    author: "Taylor Nguyen", authorRole: "Student", course: "CS201",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Feb 16, 2026", replies: 30, views: 415, likes: 22,
    preview: "Use this thread to find project partners for the CS201 final project. Please mention your skills and project idea preferences...",
  },
  {
    id: 6, pinned: false, resolved: false,
    category: "General",
    title: "Recommended resources for deep learning beyond the course?",
    author: "Morgan Lee", authorRole: "Student", course: "CS450",
    avatar: "https://images.unsplash.com/photo-1573145532966-3cefadb09b82?w=60&h=60&fit=crop&crop=face",
    time: "Feb 14, 2026", replies: 18, views: 267, likes: 53,
    preview: "The course is great but I want to go deeper. Any recommendations for books, YouTube channels, or online courses to supplement?",
  },
];

const catColors: Record<string, { bg: string; text: string }> = {
  Announcements: { bg: "#fef2f2", text: "#dc2626" },
  "Q&A": { bg: "#eff6ff", text: "#2563eb" },
  "Study Groups": { bg: "#f0fdf4", text: "#16a34a" },
  Projects: { bg: "#fdf4ff", text: "#9333ea" },
  General: { bg: "#f8fafc", text: "#475569" },
};

export function CourseForum() {
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [newThread, setNewThread] = useState({
    title: "",
    category: "General",
    details: "",
  });

  const filtered = threads.filter((t) => {
    const matchesCat = activeCategory === "All Topics" || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.preview.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-all"
          style={{ fontSize: "13px", fontWeight: 600, backgroundColor: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
        >
          <Plus size={15} />
          New Thread
        </button>
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
        {categories.map((cat) => (
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
      <div className="space-y-3">
        {filtered.map((thread) => (
          <div
            key={thread.id}
            className="bg-white rounded-2xl p-4 cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              borderLeft: thread.pinned ? "3px solid #2563eb" : "none",
            }}
          >
            <div className="flex items-start gap-4">
              <img src={thread.avatar} alt={thread.author} className="w-10 h-10 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {thread.pinned && (
                    <span className="flex items-center gap-0.5 text-blue-600" style={{ fontSize: "10px", fontWeight: 600 }}>
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  {thread.resolved && (
                    <span className="flex items-center gap-0.5 text-green-600" style={{ fontSize: "10px", fontWeight: 600 }}>
                      <CheckCircle size={10} /> Resolved
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", fontWeight: 600, ...(catColors[thread.category] || catColors.General) }}
                  >
                    {thread.category}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}
                  >
                    {thread.course}
                  </span>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                  {thread.title}
                </h3>
                <p className="line-clamp-2" style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                  {thread.preview}
                </p>
                <div className="flex items-center gap-4 mt-2.5">
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    by <span style={{ fontWeight: 500, color: "#475569" }}>{thread.author}</span>
                    {thread.authorRole === "Instructor" && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-blue-600" style={{ fontSize: "9px", fontWeight: 700, backgroundColor: "#eff6ff" }}>
                        INSTRUCTOR
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}>
                    <Clock size={11} />
                    {thread.time}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}>
                    <MessageSquare size={11} />
                    {thread.replies}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}>
                    <Eye size={11} />
                    {thread.views}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400" style={{ fontSize: "11px" }}>
                    <ThumbsUp size={11} />
                    {thread.likes}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowComposer(false)} />
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 space-y-4"
            style={{ boxShadow: "0 25px 60px rgba(15,23,42,0.25)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Start a new thread</p>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Share a question, idea, or study invite with your cohort.</p>
              </div>
              <button
                onClick={() => setShowComposer(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Thread title
                </label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-2xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: "#e2e8f0", fontSize: "13px" }}
                  placeholder="e.g. Need clarity on gradient descent intuition?"
                />
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Category
                </label>
                <div className="flex gap-2 flex-wrap">
                  {categories.filter((cat) => cat !== "All Topics").map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewThread((prev) => ({ ...prev, category: cat }))}
                      className="px-3 py-1.5 rounded-xl border transition-all"
                      style={{
                        fontSize: "11px",
                        fontWeight: newThread.category === cat ? 600 : 500,
                        backgroundColor: newThread.category === cat ? "#2563eb" : "white",
                        color: newThread.category === cat ? "white" : "#475569",
                        borderColor: newThread.category === cat ? "#2563eb" : "#e2e8f0",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1" style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Details & context
                </label>
                <textarea
                  value={newThread.details}
                  onChange={(e) => setNewThread((prev) => ({ ...prev, details: e.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  style={{ borderColor: "#e2e8f0", fontSize: "12px", backgroundColor: "#f8fafc" }}
                  placeholder="Share what you've tried, links, or what kind of support you're after."
                />
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>Rich text coming soon · attachments supported via chat</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-slate-500" style={{ fontSize: "12px" }}>
                <input type="checkbox" className="rounded border-slate-300" />
                Notify me about replies
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600"
                  style={{ fontSize: "12px", borderColor: "#e2e8f0" }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ fontSize: "12px", fontWeight: 600, background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                  onClick={() => {
                    // Placeholder submit action
                    setShowComposer(false);
                    setNewThread({ title: "", category: "General", details: "" });
                  }}
                >
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
