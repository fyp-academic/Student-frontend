import { useEffect, useState, useRef } from "react";
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
  Menu,
  X,
} from "lucide-react";
import heroVideo from "../../assets/hero.mp4";

const features = [
  {
    icon: BookOpen,
    title: "Personalised Course Catalog",
    description:
      "AI-curated learning paths that adapt to each student's pace, level, and goals.",
  },
  {
    icon: Video,
    title: "Live & Recorded Classes",
    description:
      "Join interactive live sessions or learn on your schedule with on-demand recordings.",
  },
  {
    icon: FileText,
    title: "Smart Assignments",
    description:
      "Auto-graded quizzes, rich-text assignments, and instant feedback that actually helps.",
  },
  {
    icon: MessageCircle,
    title: "Built-in AI Tutor",
    description:
      "24/7 conversational tutor that explains concepts, debugs answers, and quizzes you.",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Visualise strengths, weaknesses, and momentum with beautiful dashboards.",
  },
  {
    icon: Users,
    title: "Community & Mentors",
    description:
      "Study groups, discussion forums, and 1:1 mentorship from verified educators.",
  },
];

const stats = [
  { value: "50K+", label: "Active Learners" },
  { value: "1.2K+", label: "Expert Instructors" },
  { value: "8K+", label: "Courses & Tracks" },
  { value: "98%", label: "Satisfaction" },
];

const testimonials = [
  {
    quote:
      "The AI tutor turned my hardest module into my favourite. I finally felt seen as a learner.",
    name: "Amina K.",
    role: "Computer Science, Year 2",
  },
  {
    quote:
      "Live classes, recordings, assignments — everything is in one place. Game changer.",
    name: "Dr Kalira.",
    role: "Web Development Master",
  },
  {
    quote:
      "As an instructor, the analytics help me catch struggling students before they fall behind.",
    name: "Dr Mfringe.",
    role: "Instructor, Instructional Design",
  },
];


export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  // sticky header shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  // Scroll reveal
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        (el as HTMLElement).classList.add("is-visible");
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
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

  // Ensure video autoplay on mount (some browsers need explicit play after mount)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

   return (
    <div className="min-h-screen bg-background text-foreground antialiased">

       <SEOHead
        title="APES – AI Personalization eLearning System"
        description="APES is an AI-powered eLearning platform that personalises your learning journey through smart recommendations, adaptive quizzes, live sessions, and real-time engagement insights."
        canonical="/"
      />

      <style>{`
        [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .8s ease,transform .8s ease}
        [data-reveal].is-visible{opacity:1;transform:none}
        [data-reveal-delay="1"]{transition-delay:.08s}
        [data-reveal-delay="2"]{transition-delay:.16s}
        [data-reveal-delay="3"]{transition-delay:.24s}
        [data-reveal-delay="4"]{transition-delay:.32s}
        [data-reveal-delay="5"]{transition-delay:.4s}
        [data-reveal-delay="6"]{transition-delay:.48s}
        @keyframes lh-shine{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        .lh-title{background:linear-gradient(90deg,oklch(0.7 0.18 250),oklch(0.75 0.18 180),oklch(0.7 0.2 320),oklch(0.7 0.18 250));background-size:200% 200%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:lh-shine 8s linear infinite}
        @keyframes lh-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .lh-float{animation:lh-float 4s ease-in-out infinite}
        .lh-card{transition:transform .35s ease, box-shadow .35s ease, border-color .35s ease}
        .lh-card:hover{transform:translateY(-4px)}
        @media (prefers-reduced-motion: reduce){
          [data-reveal]{opacity:1;transform:none;transition:none}
          .lh-title{animation:none}
          .lh-float{animation:none}
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">APES LMS</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#stats" className="hover:text-primary transition-colors">Impact</a>
            <a href="#testimonials" className="hover:text-primary transition-colors">Stories</a>
            <a href="#cta" className="hover:text-primary transition-colors">Get Started</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="hidden rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition sm:inline-flex"
            >
              Get Started
            </Link>
            <button
              className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-muted"
              onClick={() => setMenuOpen((s) => !s)}
              aria-label="Open menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 px-4 py-3 space-y-2 text-sm font-medium">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block py-1">Features</a>
            <a href="#stats" onClick={() => setMenuOpen(false)} className="block py-1">Impact</a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)} className="block py-1">Stories</a>
            <Link to="/login" className="block py-1">Sign In</Link>
            <Link to="/register" className="block py-1 text-primary">Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero — full-bleed muted background video */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src={heroVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          />
          {/* Readability overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/90 dark:from-black/70 dark:via-black/50 dark:to-black/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur"
            >
              <Star className="h-3.5 w-3.5 text-amber-400" />
              Rated 4.9 by 12,000+ learners
            </span>
            <h1
              data-reveal
              data-reveal-delay="1"
              className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
            >
              Learning, <span className="lh-title">reimagined</span> for every student.
            </h1>
            <p
              data-reveal
              data-reveal-delay="2"
              className="mt-6 text-base text-foreground/80 sm:text-lg lg:text-xl"
            >
              An AI-powered LMS that blends live classes, on-demand courses, and a personal
              tutor — so every learner can move at their own pace, without falling behind.
            </p>
            <div
              data-reveal
              data-reveal-delay="3"
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition"
              >
                Start Learning Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur hover:bg-background transition"
              >
                Sign In
              </Link>
            </div>
            <div
              data-reveal
              data-reveal-delay="4"
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-foreground/70"
            >
              <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> Free forever plan</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> No credit card</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-400" /> Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              data-reveal
              data-reveal-delay={String((i % 4) + 1)}
              className="text-center"
            >
              <div className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-br from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 data-reveal className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your classroom needs, in one place
          </h2>
          <p data-reveal data-reveal-delay="1" className="mt-4 text-muted-foreground">
            Tools designed with educators, loved by learners.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                data-reveal
                data-reveal-delay={String((i % 6) + 1)}
                className="lh-card group rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:border-primary/40"
              >
                <div className="lh-float mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-cyan-400/15 text-primary ring-1 ring-border">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 data-reveal className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by learners and educators
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                data-reveal
                data-reveal-delay={String(i + 1)}
                className="lh-card rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-xl"
              >
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-muted-foreground">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600" />
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_30%_20%,#fff_0%,transparent_40%),radial-gradient(circle_at_70%_80%,#fff_0%,transparent_40%)]" />
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 text-center text-white">
          <Zap data-reveal className="mx-auto h-10 w-10" />
          <h2 data-reveal data-reveal-delay="1" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to transform how you learn?
          </h2>
          <p data-reveal data-reveal-delay="2" className="mt-4 text-white/85">
            Join thousands of students already learning smarter on LearnHub.
          </p>
          <div data-reveal data-reveal-delay="3" className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg hover:bg-white/90 transition"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-2 font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-white">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span>APES LMS</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                A modern LMS built for the way today's students actually learn.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#stats" className="hover:text-foreground">Impact</a></li>
                <li><a href="#testimonials" className="hover:text-foreground">Stories</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold">Account</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/login" className="hover:text-foreground">Login</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Register</Link></li>
                <li><Link to="/forgot-password" className="hover:text-foreground">Forgot Password</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <div>© {new Date().getFullYear()} LearnHub. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
