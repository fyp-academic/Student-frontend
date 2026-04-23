import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Star, Clock, Users, BookOpen, ChevronRight, X, Loader2 } from "lucide-react";
import { coursesApi, categoriesApi } from "../services/api";

type Course = Record<string, unknown>;
type Category = Record<string, unknown>;

const levelColors: Record<string, { bg: string; text: string }> = {
  Beginner:     { bg: "#f0fdf4", text: "#16a34a" },
  beginner:     { bg: "#f0fdf4", text: "#16a34a" },
  Intermediate: { bg: "#eff6ff", text: "#2563eb" },
  intermediate: { bg: "#eff6ff", text: "#2563eb" },
  Advanced:     { bg: "#fdf4ff", text: "#9333ea" },
  advanced:     { bg: "#fdf4ff", text: "#9333ea" },
};

const COURSE_COLORS = ["#2563eb","#0891b2","#7c3aed","#059669","#dc2626","#f59e0b","#0f766e","#be185d"];

export function LearningCatalog() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [courses, setCourses]         = useState<Course[]>([]);
  const [categories, setCategories]   = useState<string[]>(["All"]);
  const [loading, setLoading]         = useState(true);
  const [enrolling, setEnrolling]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      coursesApi.catalog(),
      categoriesApi.list(),
    ]).then(([cRes, catRes]) => {
      const rawCourses: Course[] = cRes.data.data ?? cRes.data ?? [];
      setCourses(rawCourses);
      const rawCats: Category[] = catRes.data.data ?? catRes.data ?? [];
      setCategories(["All", ...rawCats.map(c => String(c.name ?? ''))]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleEnroll = useCallback(async (courseId: string, isEnrolled: boolean) => {
    setEnrolling(courseId);
    try {
      if (isEnrolled) {
        await coursesApi.leave(courseId);
      } else {
        await coursesApi.selfEnroll(courseId);
      }
      setCourses(prev => prev.map(c =>
        String(c.id) === courseId ? { ...c, is_enrolled: !isEnrolled, enrolled: !isEnrolled } : c
      ));
    } catch { /* ignore */ } finally {
      setEnrolling(null);
    }
  }, []);

  const filtered = courses.filter((c) => {
    const title      = String(c.title ?? c.name ?? "").toLowerCase();
    const instructor = String(c.instructor ?? c.instructor_name ?? "").toLowerCase();
    const code       = String(c.short_name ?? c.shortName ?? c.code ?? "").toLowerCase();
    const catName    = String(c.category_name ?? c.category ?? "");
    const matchesSearch = title.includes(search.toLowerCase()) ||
      instructor.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || catName === activeCategory;
    return matchesSearch && matchesCat;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Learning Catalog</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Explore {courses.length} course{courses.length !== 1 ? "s" : ""} available at University
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses, instructors, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            style={{ fontSize: "13px", borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0"
          style={{ fontSize: "13px", borderColor: "#e2e8f0" }}
        >
          <Filter size={15} />
          Filters
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat: string) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-xl border transition-all"
            style={{
              fontSize: "12px",
              fontWeight: activeCategory === cat ? 600 : 400,
              backgroundColor: activeCategory === cat ? "#2563eb" : "white",
              color: activeCategory === cat ? "white" : "#475569",
              borderColor: activeCategory === cat ? "#2563eb" : "#e2e8f0",
              boxShadow: activeCategory === cat ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ fontSize: "13px", color: "#64748b" }}>
        Showing <span style={{ fontWeight: 600, color: "#1e293b" }}>{filtered.length}</span> course{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <BookOpen size={32} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>No courses match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course, idx) => {
            const id         = String(course.id ?? idx);
            const title      = String(course.title ?? course.name ?? "");
            const code       = String(course.short_name ?? course.shortName ?? course.code ?? "");
            const instructor = String(course.instructor ?? course.instructor_name ?? "");
            const level      = String(course.level ?? "");
            const description = String(course.description ?? course.summary ?? "");
            const image      = String(course.image ?? course.image_url ?? "");
            const rating     = Number(course.rating ?? 0);
            const reviews    = Number(course.reviews_count ?? course.reviews ?? 0);
            const students   = Number(course.enrolled_students ?? course.students ?? 0);
            const duration   = String(course.duration ?? "");
            const tags: string[] = Array.isArray(course.tags) ? (course.tags as string[]) : [];
            const isEnrolled = Boolean(course.is_enrolled ?? course.enrolled);
            const color      = COURSE_COLORS[idx % COURSE_COLORS.length];
            const levelStyle = levelColors[level] ?? { bg: "#f8fafc", text: "#475569" };
            const isEnrollingThis = enrolling === id;

            return (
              <div
                key={id}
                className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1 cursor-pointer"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <div className="relative h-36 overflow-hidden">
                  {image ? (
                    <img src={image} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: color }}>
                      <BookOpen size={36} color="rgba(255,255,255,0.6)" />
                    </div>
                  )}
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))" }} />
                  {isEnrolled && (
                    <span
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-white"
                      style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#22c55e" }}
                    >
                      ✓ ENROLLED
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white" style={{ fontSize: "11px", fontWeight: 700, backgroundColor: color, padding: "2px 8px", borderRadius: "6px" }}>
                      {code}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: "1.4" }}>{title}</h3>
                    {level && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-lg" style={{ fontSize: "10px", fontWeight: 600, ...levelStyle }}>
                        {level}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{instructor}</p>
                  {description && (
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.5" }}>
                      {description.slice(0, 100)}{description.length > 100 ? "…" : ""}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md" style={{ fontSize: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                    {rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={12} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{rating.toFixed(1)}</span>
                        {reviews > 0 && <span style={{ fontSize: "11px", color: "#94a3b8" }}>({reviews})</span>}
                      </div>
                    )}
                    {students > 0 && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users size={12} />
                        <span style={{ fontSize: "11px" }}>{students.toLocaleString()}</span>
                      </div>
                    )}
                    {duration && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={12} />
                        <span style={{ fontSize: "11px" }}>{duration}</span>
                      </div>
                    )}
                  </div>
                  <button
                    disabled={isEnrollingThis}
                    onClick={() => handleEnroll(id, isEnrolled)}
                    className="w-full mt-3 py-2 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    style={{
                      fontSize: "13px", fontWeight: 600,
                      backgroundColor: isEnrolled ? "#f0fdf4" : "#eff6ff",
                      color: isEnrolled ? "#16a34a" : "#2563eb",
                      border: `1px solid ${isEnrolled ? "#bbf7d0" : "#bfdbfe"}`,
                    }}
                  >
                    {isEnrollingThis ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isEnrolled ? (
                      <>Continue Learning <ChevronRight size={14} /></>
                    ) : (
                      <>Enroll Now <BookOpen size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
