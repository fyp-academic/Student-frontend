import { useEffect, useState } from "react";
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
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

const features = [
  { icon: BookOpen, title: "Personalised Course Catalog", description: "AI analyses your learning history and recommends the most relevant courses tailored to your pace and goals." },
  { icon: Video, title: "Live Interactive Sessions", description: "Join real-time video lectures, polls, and Q&A sessions with instructors from anywhere on any device." },
  { icon: FileText, title: "Smart Assignments & Quizzes", description: "Submit assignments, take adaptive quizzes, and receive instant AI-generated feedback on your performance." },
  { icon: MessageCircle, title: "Collaborative Learning", description: "Engage in course forums and direct chat with peers and instructors to deepen understanding together." },
  { icon: TrendingUp, title: "AI Engagement Insights", description: "Visualise your learning streaks, progress heatmaps, and receive personalised AI study tips to stay on track." },
  { icon: Users, title: "Instructor Connect", description: "Access instructor profiles, course materials, and office hours — all organised in one clean dashboard." },
];

const highlights = [
  "AI-powered personalised learning recommendations",
  "Adaptive quizzes that adjust to your skill level",
  "Live video sessions with Jitsi-powered conferencing",
  "Smart progress tracking and engagement analytics",
  "Course forums, chat, and peer collaboration tools",
  "Mobile-friendly — learn from any device, anywhere",
];

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // theme toggle (persisted)
  useEffect(() => {
    const saved = localStorage.getItem("apes-theme");
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefers;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("apes-theme", next ? "dark" : "light");
  };

  // sticky header shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1e4a]">
        <div className="w-10 h-10 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="APES – AI Personalization eLearning System"
        description="APES is an AI-powered eLearning platform that personalises your learning journey through smart recommendations, adaptive quizzes, live sessions, and real-time engagement insights."
        canonical="/"
      />

      {/* Inline styles for animations + reveal (scoped via class names) */}
      <style>{`
        @keyframes apes-float { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-20px) translateX(10px)} }
        @keyframes apes-float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
        @keyframes apes-blob { 0%,100%{border-radius:42% 58% 60% 40%/45% 55% 45% 55%; transform:translate(0,0) rotate(0deg)} 50%{border-radius:58% 42% 40% 60%/55% 45% 55% 45%; transform:translate(20px,-15px) rotate(20deg)} }
        @keyframes apes-grid-pan { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes apes-pulse-ring { 0%{transform:scale(.8);opacity:.7} 100%{transform:scale(2);opacity:0} }
        @keyframes apes-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes apes-fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .reveal { opacity:0; transform:translateY(24px); transition:opacity .7s ease, transform .7s ease; }
        .reveal-in { opacity:1; transform:translateY(0); }
        .apes-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: apes-grid-pan 20s linear infinite;
        }
        .apes-blob { animation: apes-blob 14s ease-in-out infinite; filter: blur(40px); }
        .apes-float { animation: apes-float 8s ease-in-out infinite; }
        .apes-float-slow { animation: apes-float-slow 12s ease-in-out infinite; }
        .apes-pulse-ring::after {
          content:''; position:absolute; inset:0; border-radius:9999px;
          border:2px solid rgba(34,197,94,.5);
          animation: apes-pulse-ring 2.4s ease-out infinite;
        }
        .apes-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          background-size: 200% 100%;
          animation: apes-shimmer 2.5s linear infinite;
        }
        .apes-hero-title span.gradient {
          background: linear-gradient(90deg,#22c55e,#34d399,#60a5fa,#22c55e);
          background-size: 200% auto;
          -webkit-background-clip:text; background-clip:text; color:transparent;
          animation: apes-shimmer 4s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .apes-grid,.apes-blob,.apes-float,.apes-float-slow,.apes-pulse-ring::after,.apes-shimmer,.apes-hero-title span.gradient { animation: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        {/* ── Header ── */}
        <header
          className={`sticky top-0 z-50 backdrop-blur-md transition-all ${
            scrolled
              ? "bg-[#0c1e4a]/90 dark:bg-slate-950/80 shadow-lg shadow-black/20"
              : "bg-[#0c1e4a] dark:bg-slate-950"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 group" aria-label="APES LMS home">
              <div className="relative flex items-center justify-center rounded-xl w-10 h-10 bg-emerald-500 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div className="hidden xs:block sm:block">
                <p className="text-white font-bold text-base leading-none">APES LMS</p>
                <p className="text-[11px] text-blue-300">University of Dodoma</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                className="p-2 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link
                to="/login"
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="relative px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero with motion background ── */}
        <section className="relative overflow-hidden text-center px-4 sm:px-6 py-20 sm:py-28 isolate">
          {/* gradient base */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(135deg,#0c1e4a 0%,#1e3a8a 55%,#1e40af 100%)",
            }}
          />
          {/* animated grid */}
          <div className="absolute inset-0 -z-10 apes-grid opacity-40" />
          {/* blobs */}
          <div className="absolute -top-24 -left-20 w-80 h-80 bg-emerald-500/30 apes-blob -z-10" />
          <div className="absolute top-32 -right-20 w-96 h-96 bg-blue-500/30 apes-blob -z-10" style={{ animationDelay: "-4s" }} />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-indigo-500/25 apes-blob -z-10" style={{ animationDelay: "-8s" }} />

          {/* floating student icons */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <BookOpen className="absolute top-[15%] left-[8%] text-white/15 apes-float" size={42} />
            <GraduationCap className="absolute top-[25%] right-[10%] text-white/15 apes-float-slow" size={48} />
            <Video className="absolute bottom-[20%] left-[12%] text-white/15 apes-float-slow" size={38} />
            <MessageCircle className="absolute bottom-[28%] right-[14%] text-white/15 apes-float" size={36} />
            <FileText className="absolute top-[55%] left-[20%] text-white/10 apes-float-slow" size={32} />
            <Users className="absolute top-[60%] right-[22%] text-white/10 apes-float" size={34} />
            <Sparkles className="absolute top-[10%] left-[45%] text-emerald-300/40 apes-float" size={20} />
            <Sparkles className="absolute bottom-[15%] right-[40%] text-blue-300/40 apes-float-slow" size={16} />
          </div>

          <div className="max-w-3xl mx-auto relative" style={{ animation: "apes-fade-up .8s ease both" }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
              <span className="relative w-2 h-2 rounded-full bg-emerald-400 apes-pulse-ring" />
              AI-Powered Personalized eLearning
            </span>
            <h1 className="apes-hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Learning That <span className="gradient">Adapts to You</span>
            </h1>
            <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto text-blue-200">
              APES uses artificial intelligence to personalise your learning journey —
              smart course recommendations, adaptive quizzes, live sessions, and real-time
              engagement insights all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-400 shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              >
                Create Your Account
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-0.5"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>

          {/* soft fade to next section */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-950" />
        </section>

        {/* ── Highlights strip ── */}
        <section className="py-10 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {highlights.map((item, i) => (
              <div
                key={item}
                data-reveal
                className="reveal flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14 reveal" data-reveal>
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 dark:text-white">
                Everything You Need to Learn Smarter
              </h2>
              <p className="text-base max-w-xl mx-auto text-slate-600 dark:text-slate-400">
                A complete AI-driven eLearning ecosystem built for students who want personalised,
                effective, and engaging online education.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  data-reveal
                  style={{ transitionDelay: `${i * 80}ms` }}
                  className="reveal group relative rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 dark:hover:border-blue-700"
                >
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-blue-50 dark:bg-blue-950/50 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                    <Icon size={22} className="text-blue-600 dark:text-blue-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="relative py-16 px-4 sm:px-6 overflow-hidden bg-[#0c1e4a] dark:bg-slate-900">
          <div className="absolute inset-0 apes-grid opacity-20" />
          <div className="relative max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "AI", label: "Powered Recommendations" },
              { value: "20+", label: "Courses Available" },
              { value: "Live", label: "Video Sessions" },
              { value: "24/7", label: "Online Access" },
            ].map(({ value, label }, i) => (
              <div key={label} data-reveal className="reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <p className="text-3xl sm:text-4xl font-extrabold mb-1 text-emerald-400">{value}</p>
                <p className="text-sm text-blue-300">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 sm:px-6 text-center bg-white dark:bg-slate-950">
          <div className="max-w-2xl mx-auto reveal" data-reveal>
            <div className="flex justify-center mb-4" aria-label="5 star rating">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} fill="#f59e0b" stroke="none" />
              ))}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Ready for Smarter Learning?
            </h2>
            <p className="text-base mb-8 text-slate-600 dark:text-slate-400">
              Join students already using APES to get AI-personalised course recommendations,
              attend live sessions, and track their academic progress intelligently.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-[#0c1e4a] dark:bg-emerald-500 hover:bg-[#1e3a8a] dark:hover:bg-emerald-400 shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Zap size={18} /> Get Started for Free
            </Link>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="py-10 px-4 sm:px-6 bg-[#0c1e4a] dark:bg-slate-950 border-t border-white/5">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap size={20} className="text-emerald-400" />
              <span className="text-white font-semibold text-sm">APES eLearning</span>
            </div>
            <p className="text-xs text-blue-300">
              AI Personalization eLearning System — Built by Kalira
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
              <Link to="/login" className="text-xs text-blue-300 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="text-xs text-blue-300 hover:text-white transition-colors">Register</Link>
              <Link to="/forgot-password" className="text-xs text-blue-300 hover:text-white transition-colors">Forgot Password</Link>
            </div>
            <p className="text-[11px] text-blue-400/60 mt-6">
              © {new Date().getFullYear()} APES LMS. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
