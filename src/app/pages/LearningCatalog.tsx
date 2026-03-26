import { useState } from "react";
import { Search, Filter, Star, Clock, Users, BookOpen, ChevronRight, X } from "lucide-react";

const categories = ["All", "Computer Science", "Mathematics", "Sciences", "Engineering", "Business", "Humanities"];

const courses = [
  {
    id: 1, code: "CS101", title: "Introduction to Programming", category: "Computer Science",
    instructor: "Prof. Maria Santos", rating: 4.8, reviews: 1240, students: 3200, duration: "12 weeks",
    image: "https://images.unsplash.com/photo-1617240016072-d92174e44171?w=400&h=220&fit=crop",
    level: "Beginner", enrolled: false, color: "#2563eb",
    tags: ["Python", "Algorithms", "OOP"], description: "Master the fundamentals of programming using Python."
  },
  {
    id: 2, code: "CS301", title: "Data Science Fundamentals", category: "Computer Science",
    instructor: "Adelfina Mambali", rating: 4.9, reviews: 892, students: 2100, duration: "14 weeks",
    image: "https://images.unsplash.com/photo-1749006590639-e749e6b7d84c?w=400&h=220&fit=crop",
    level: "Intermediate", enrolled: true, color: "#0891b2",
    tags: ["Python", "ML", "Statistics"], description: "Dive into data analysis, visualization, and machine learning."
  },
  {
    id: 3, code: "MATH402", title: "Advanced Calculus", category: "Mathematics",
    instructor: "Prof. John Miller", rating: 4.6, reviews: 567, students: 890, duration: "16 weeks",
    image: "https://images.unsplash.com/photo-1732304719443-c3c04003bf25?w=400&h=220&fit=crop",
    level: "Advanced", enrolled: true, color: "#7c3aed",
    tags: ["Calculus", "Analysis", "Proofs"], description: "Advanced multivariable calculus and real analysis."
  },
  {
    id: 4, code: "BIO301", title: "Molecular Biology", category: "Sciences",
    instructor: "Dr. Emily Ross", rating: 4.7, reviews: 420, students: 680, duration: "12 weeks",
    image: "https://images.unsplash.com/photo-1634872554756-18534b7ffe30?w=400&h=220&fit=crop",
    level: "Intermediate", enrolled: true, color: "#059669",
    tags: ["Genetics", "DNA", "Proteins"], description: "Explore the molecular mechanisms of life."
  },
  {
    id: 5, code: "CS450", title: "AI & Machine Learning", category: "Computer Science",
    instructor: "Dr. James Liu", rating: 4.9, reviews: 1105, students: 2800, duration: "15 weeks",
    image: "https://images.unsplash.com/photo-1763615834709-cd4b196980db?w=400&h=220&fit=crop",
    level: "Advanced", enrolled: true, color: "#dc2626",
    tags: ["AI", "Neural Networks", "Deep Learning"], description: "Comprehensive guide to modern AI and ML techniques."
  },
  {
    id: 6, code: "ENG205", title: "Technical Writing", category: "Humanities",
    instructor: "Prof. Anna Blake", rating: 4.4, reviews: 310, students: 540, duration: "8 weeks",
    image: "https://images.unsplash.com/photo-1762329388386-22bf162a9368?w=400&h=220&fit=crop",
    level: "Beginner", enrolled: false, color: "#f59e0b",
    tags: ["Writing", "Communication", "Reports"], description: "Learn to write clear, concise technical documentation."
  },
];

const levelColors: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: "#f0fdf4", text: "#16a34a" },
  Intermediate: { bg: "#eff6ff", text: "#2563eb" },
  Advanced: { bg: "#fdf4ff", text: "#9333ea" },
};

export function LearningCatalog() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "All" || c.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1e293b" }}>Learning Catalog</h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginTop: "2px" }}>
          Explore {courses.length} courses available at University
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
        {categories.map((cat) => (
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
        Showing <span style={{ fontWeight: 600, color: "#1e293b" }}>{filtered.length}</span> courses
      </p>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1 cursor-pointer"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div className="relative h-36 overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))" }} />
              {course.enrolled && (
                <span
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-white"
                  style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "#22c55e" }}
                >
                  ✓ ENROLLED
                </span>
              )}
              <div className="absolute bottom-3 left-3">
                <span className="text-white" style={{ fontSize: "11px", fontWeight: 700, backgroundColor: course.color, padding: "2px 8px", borderRadius: "6px" }}>
                  {course.code}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b", lineHeight: "1.4" }}>
                  {course.title}
                </h3>
                <span
                  className="flex-shrink-0 px-2 py-0.5 rounded-lg"
                  style={{ fontSize: "10px", fontWeight: 600, ...levelColors[course.level] }}
                >
                  {course.level}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{course.instructor}</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", lineHeight: "1.5" }}>
                {course.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {course.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md"
                    style={{ fontSize: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                <div className="flex items-center gap-1">
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{course.rating}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>({course.reviews})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Users size={12} />
                  <span style={{ fontSize: "11px" }}>{course.students.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock size={12} />
                  <span style={{ fontSize: "11px" }}>{course.duration}</span>
                </div>
              </div>
              <button
                className="w-full mt-3 py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: course.enrolled ? "#f0fdf4" : "#eff6ff",
                  color: course.enrolled ? "#16a34a" : "#2563eb",
                  border: `1px solid ${course.enrolled ? "#bbf7d0" : "#bfdbfe"}`,
                }}
              >
                {course.enrolled ? (
                  <>Continue Learning <ChevronRight size={14} /></>
                ) : (
                  <>Enroll Now <BookOpen size={14} /></>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
