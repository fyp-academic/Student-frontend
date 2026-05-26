import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { SEOHead } from "../components/SEOHead";
import {
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Course Catalog",
    description: "Browse a wide range of courses offered at the University of Dodoma across all faculties and departments.",
  },
  {
    icon: Video,
    title: "Live Sessions",
    description: "Join real-time video lectures and interactive sessions hosted by your instructors from anywhere.",
  },
  {
    icon: FileText,
    title: "Assignments & Assessments",
    description: "Submit assignments, take quizzes, and receive feedback — all tracked in one organised space.",
  },
  {
    icon: MessageCircle,
    title: "Course Forums & Chat",
    description: "Collaborate with classmates and instructors through course forums and direct messaging.",
  },
  {
    icon: TrendingUp,
    title: "Engagement Analytics",
    description: "Track your learning progress, activity streaks, and get AI-powered study tips.",
  },
  {
    icon: Users,
    title: "Instructor Connect",
    description: "Access profiles and materials from your UDOM instructors in a single streamlined portal.",
  },
];

const highlights = [
  "Official LMS for University of Dodoma (UDOM)",
  "Access courses, lessons, and resources online",
  "Attend live sessions with Jitsi-powered video",
  "Submit assignments and track grades",
  "Practice quizzes and interactive activities",
  "Mobile-friendly — learn from any device",
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0c1e4a" }}>
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="APES UDOM – University of Dodoma Student Learning Portal"
        description="APES UDOM is the official LMS for University of Dodoma students. Browse courses, join live sessions, submit assignments, and connect with instructors — all in one place."
        canonical="/"
      />

      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        {/* ── Navbar ── */}
        <header style={{ backgroundColor: "#0c1e4a" }}>
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl w-10 h-10"
                style={{ backgroundColor: "#22c55e" }}
              >
                <GraduationCap size={22} color="white" />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-none">APES LMS</p>
                <p className="text-xs" style={{ color: "#93c5fd" }}>University of Dodoma</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "#bfdbfe" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#bfdbfe")}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ backgroundColor: "#22c55e", color: "#fff" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ── */}
        <section
          className="py-20 px-6 text-center"
          style={{
            background: "linear-gradient(135deg, #0c1e4a 0%, #1e3a8a 60%, #1e40af 100%)",
          }}
        >
          <div className="max-w-3xl mx-auto">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
              style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              Official UDOM Student Portal
            </span>
            <h1
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5"
            >
              Learn Smarter at{" "}
              <span style={{ color: "#22c55e" }}>University of Dodoma</span>
            </h1>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "#bfdbfe" }}>
              APES UDOM connects UDOM students with courses, live lectures, assignments, and
              collaborative tools — designed for the modern learner.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-transform hover:scale-105"
                style={{ backgroundColor: "#22c55e", fontSize: "15px" }}
              >
                Create Your Account <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", fontSize: "15px", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </section>

        {/* ── Highlights strip ── */}
        <section className="py-10 px-6" style={{ backgroundColor: "#fff", borderBottom: "1px solid #e2e8f0" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                <span className="text-sm" style={{ color: "#374151" }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3" style={{ color: "#0f172a" }}>
                Everything You Need to Succeed
              </h2>
              <p className="text-base max-w-xl mx-auto" style={{ color: "#64748b" }}>
                A complete learning ecosystem built specifically for UDOM students and instructors.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl p-6 border transition-shadow hover:shadow-md"
                  style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}
                >
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    <Icon size={22} style={{ color: "#2563eb" }} />
                  </div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: "#0f172a" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="py-16 px-6" style={{ backgroundColor: "#0c1e4a" }}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "UDOM", label: "University" },
              { value: "20+", label: "Courses Available" },
              { value: "Live", label: "Video Sessions" },
              { value: "24/7", label: "Online Access" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold mb-1" style={{ color: "#22c55e" }}>{value}</p>
                <p className="text-sm" style={{ color: "#93c5fd" }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-6 text-center" style={{ backgroundColor: "#fff" }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill="#f59e0b" stroke="none" />
              ))}
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: "#0f172a" }}>
              Ready to Start Learning?
            </h2>
            <p className="text-base mb-8" style={{ color: "#64748b" }}>
              Join UDOM students already using APES to manage their courses, attend live sessions, and
              achieve their academic goals.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-transform hover:scale-105"
              style={{ backgroundColor: "#0c1e4a", fontSize: "15px" }}
            >
              <Zap size={18} /> Get Started for Free
            </Link>
            <p className="mt-4 text-sm" style={{ color: "#94a3b8" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#2563eb", fontWeight: 600 }}>
                Sign in here
              </Link>
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-8 px-6 text-center" style={{ backgroundColor: "#0c1e4a", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap size={18} color="#22c55e" />
            <span className="text-white font-semibold text-sm">APES UDOM</span>
          </div>
          <p className="text-xs" style={{ color: "#60a5fa" }}>
            Academic Platform for Enhanced Students — University of Dodoma, Tanzania
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link to="/login" className="text-xs hover:text-white transition-colors" style={{ color: "#93c5fd" }}>Login</Link>
            <Link to="/register" className="text-xs hover:text-white transition-colors" style={{ color: "#93c5fd" }}>Register</Link>
            <Link to="/forgot-password" className="text-xs hover:text-white transition-colors" style={{ color: "#93c5fd" }}>Forgot Password</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
