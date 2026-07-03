import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { SEOHead } from "../components/SEOHead";
import {
  BookOpen,
  Video,
  FileText,
  MessageCircle,
  TrendingUp,
  Users,
  ArrowRight,
  Star,
  Menu,
  X,
  Plus,
  Minus,
} from "lucide-react";
import ScrollReveal from "../components/editorial/ScrollReveal";
import ThemeToggle from "../components/editorial/ThemeToggle";
import CustomCursor from "../components/editorial/CustomCursor";
import HeroCarousel from "../components/editorial/HeroCarousel";
import { useLenis } from "../components/editorial/useLenis";
import heroImg1 from "../../assets/hero-images/image1.jpeg";
import heroImg2 from "../../assets/hero-images/image2.jpeg";
import heroImg3 from "../../assets/hero-images/image3.jpeg";
import heroImg4 from "../../assets/hero-images/image4.jpeg";

// Editorial stock imagery (Unsplash). Each <img> keeps a warm bg-paper-2
// placeholder so the layout holds if a photo is slow / fails to load.
const IMAGES = {
  story: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=80",
};

// Hero background slideshow — local student photos (src/assets/hero-images).
// They auto-cycle with a crossfade behind the hero content.
const HERO_IMAGES = [
  { src: heroImg1, alt: "Students learning together" },
  { src: heroImg2, alt: "Student studying on campus" },
  { src: heroImg3, alt: "Students collaborating around a laptop" },
  { src: heroImg4, alt: "Group of students in class" },
];

const features = [
  {
    icon: BookOpen,
    title: "Personalised Course Catalog",
    description:
      "AI-curated learning paths that adapt to each student's pace, level, and goals.",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
    alt: "Stack of books and study notes on a desk",
  },
  {
    icon: Video,
    title: "Live & Recorded Classes",
    description:
      "Join interactive live sessions or learn on your schedule with on-demand recordings.",
    image:
      "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=900&q=80",
    alt: "Laptop showing a live video class with participants in a grid",
  },
  {
    icon: FileText,
    title: "Smart Assignments",
    description:
      "Auto-graded quizzes, rich-text assignments, and instant feedback that actually helps.",
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    alt: "Student writing notes beside a laptop",
  },
  {
    icon: MessageCircle,
    title: "Built-in AI Tutor",
    description:
      "24/7 conversational tutor that explains concepts, debugs answers, and quizzes you.",
    image:
      "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=900&q=80",
    alt: "Student chatting and learning at a laptop",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Visualise strengths, weaknesses, and momentum with beautiful dashboards.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    alt: "Analytics dashboard with charts and graphs",
  },
  {
    icon: Users,
    title: "Community & Mentors",
    description:
      "Study groups, discussion forums, and 1:1 mentorship from verified educators.",
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80",
    alt: "Group of students collaborating around a laptop",
  },
];

const stats = [
  { value: "6", label: "Active Learners" },
  { value: "2", label: "Expert Instructors" },
  { value: "5", label: "Courses & Tracks" },
  { value: "50%", label: "Satisfaction" },
];

const testimonials = [
  {
    quote:
      "The AI tutor turned my hardest module into my favourite. I finally felt seen as a learner.",
    name: "Amina K.",
    role: "Computer Science, Year 2",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
  },
  {
    quote:
      "Live classes, recordings, assignments — everything is in one place. Game changer.",
    name: "Dr Kalira.",
    role: "Web Development Master",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
  {
    quote:
      "As an instructor, the analytics help me catch struggling students before they fall behind.",
    name: "Dr Mfringe.",
    role: "Instructor, Instructional Design",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
  },
];

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#stats", label: "Impact" },
  { href: "#testimonials", label: "Stories" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFeature, setOpenFeature] = useState(0);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useLenis();

  // sticky header shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div
      className="min-h-screen bg-paper text-ink antialiased"
      style={{ fontFamily: '"Inter Variable", Inter, system-ui, sans-serif' }}
    >
      <SEOHead
        title="Smart Learning Platform"
        description="APES LMS is an AI-powered eLearning platform that personalises your learning journey through smart recommendations, adaptive quizzes, live sessions, and real-time engagement insights."
        canonical="/"
      />

      <CustomCursor />

      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-paper/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-editorial-1" : ""
        }`}
      >
        <div className="ed-shell flex h-16 items-center justify-between md:h-20">
          <Link
            to="/"
            data-cursor
            aria-label="APES home"
            className="font-display ed-display text-step-4 leading-none text-ink"
          >
            APES
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                data-cursor
                className="link-underline text-step-2 text-ink"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            <Link
              to="/login"
              data-cursor
              className="hidden text-step-2 text-ink link-underline sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              data-cursor
              className="hidden rounded-full bg-ink px-5 py-2.5 text-step-2 text-paper transition-colors duration-300 hover:bg-clay-deep sm:inline-flex"
            >
              Get Started
            </Link>
            <ThemeToggle />
            <button
              type="button"
              data-cursor
              className="md:hidden text-ink"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-line bg-paper px-0 md:hidden">
            <ul className="ed-shell flex flex-col gap-1 py-5 text-step-3">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 font-display ed-display text-ink"
                  >
                    {n.label}
                  </a>
                </li>
              ))}
              <li className="border-t border-line pt-2">
                <Link to="/login" className="block py-2 text-step-2 text-ink">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="block py-2 text-step-2 text-clay">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        )}
      </header>

      {/* Hero — local student photos as a full-bleed background slideshow */}
      <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-neutral-900">
        {/* Background slideshow */}
        <HeroCarousel images={HERO_IMAGES} fill />
        {/* Legibility overlay — fixed dark scrim (theme-independent so photos stay clear in dark mode) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/40" />

        {/* Content */}
        <div className="relative w-full ed-shell py-24 md:py-28">
          <ScrollReveal className="max-w-3xl" y={28}>
            <h1 className="font-display ed-display text-step-8 text-white">
              Learning, personalised to every student
            </h1>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                to="/register"
                data-cursor
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-step-2 text-neutral-900 transition-colors duration-300 hover:bg-clay hover:text-white"
              >
                Start Learning Free
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/login"
                data-cursor
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-step-2 text-white transition-colors duration-300 hover:border-white"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-step-1 text-white/80">
              {["Free forever plan", "No credit card", "Cancel anytime"].map(
                (t, i) => (
                  <span
                    key={t}
                    className={
                      i < 2
                        ? "after:ml-3 after:text-white/40 after:content-['/']"
                        : ""
                    }
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats — right-to-left infinite marquee (content duplicated for a seamless loop) */}
      <section
        id="stats"
        aria-label="By the numbers"
        className="overflow-hidden border-y border-line bg-paper-2 py-14"
      >
        <div className="ed-marquee">
          {[...stats, ...stats].map((s, i) => {
            const dup = i >= stats.length;
            return (
              <div
                key={`${s.label}-${i}`}
                data-dup={dup ? "true" : undefined}
                aria-hidden={dup ? true : undefined}
                className="flex shrink-0 flex-col items-center justify-center border-l border-line px-12 text-center sm:px-16"
              >
                <span className="font-display ed-display text-step-6 text-ink">
                  {s.value}
                </span>
                <span className="eyebrow mt-2 whitespace-nowrap">{s.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="ed-shell ed-section">
        <ScrollReveal className="max-w-prose">
          <p className="eyebrow mb-4">What you get</p>
          <h2 className="font-display ed-display text-step-6 text-ink">
            Everything your classroom needs, in one place
          </h2>
          <p className="mt-4 text-step-3 text-ink-2">
            Tools designed with educators, loved by learners.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-14 border-t border-line">
          {features.map((f, i) => {
            const Icon = f.icon;
            const open = openFeature === i;
            return (
              <div key={f.title} className="border-b border-line">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFeature(open ? -1 : i)}
                    aria-expanded={open}
                    aria-controls={`feature-panel-${i}`}
                    className="group flex w-full items-center justify-between gap-4 py-6 text-left"
                  >
                    <span className="flex items-center gap-4">
                      <span
                        className={`inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border text-clay transition-colors duration-300 ${
                          open ? "border-ink" : "border-line group-hover:border-ink"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-display ed-display text-step-4 text-ink">
                        {f.title}
                      </span>
                    </span>
                    <span
                      className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                        open
                          ? "border-ink text-clay"
                          : "border-line text-ink group-hover:border-ink"
                      }`}
                    >
                      {open ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                </h3>

                <div
                  id={`feature-panel-${i}`}
                  role="region"
                  className={`grid transition-all duration-300 ease-out ${
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-6 pb-8 md:grid-cols-2 md:items-center">
                      <p className="text-step-2 text-ink-2">{f.description}</p>
                      <img
                        src={f.image}
                        alt={f.alt}
                        loading="lazy"
                        className="h-56 w-full rounded-[14px] bg-paper-2 object-cover md:h-48"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollReveal>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-y border-line bg-paper-2">
        <div className="ed-shell ed-section">
          <ScrollReveal className="max-w-prose">
            <p className="eyebrow mb-4">Stories</p>
            <h2 className="font-display ed-display text-step-6 text-ink">
              Loved by learners and educators
            </h2>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollReveal
                key={t.name}
                delay={i * 0.08}
                className="flex h-full flex-col rounded-[18px] border border-line bg-paper p-7"
              >
                <div className="flex gap-1 text-clay">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 font-display ed-display text-step-3 leading-snug text-ink">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    loading="lazy"
                    className="h-11 w-11 rounded-full bg-paper-2 object-cover"
                  />
                  <span className="text-step-1">
                    <span className="block font-medium text-ink">{t.name}</span>
                    <span className="block text-ink-2">{t.role}</span>
                  </span>
                </figcaption>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="ed-shell ed-section">
        <ScrollReveal className="grid grid-cols-1 items-center gap-10 overflow-hidden rounded-[18px] border border-line bg-paper-2 lg:grid-cols-2">
          <div className="order-2 p-8 sm:p-12 lg:order-1">
            <p className="eyebrow mb-4">Get started</p>
            <h2 className="font-display ed-display text-step-6 text-ink">
              Ready to transform how you learn?
            </h2>
            <p className="mt-4 max-w-prose text-step-3 text-ink-2">
              Join thousands of students already learning smarter on APES.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/register"
                data-cursor
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-step-2 text-paper transition-colors duration-300 hover:bg-clay-deep"
              >
                Get Started Free
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                to="/login"
                data-cursor
                className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-step-2 text-ink transition-colors duration-300 hover:border-ink"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="order-1 h-full lg:order-2">
            <img
              src={IMAGES.story}
              alt="Students collaborating"
              loading="lazy"
              className="h-full min-h-[260px] w-full object-cover"
            />
          </div>
        </ScrollReveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-paper">
        <div className="ed-shell py-14">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link
                to="/"
                className="font-display ed-display text-step-4 text-ink"
              >
                APES
              </Link>
              <p className="mt-4 max-w-sm text-step-2 text-ink-2">
                A modern LMS built for the way today's students actually learn.
              </p>
            </div>
            <div>
              <div className="eyebrow mb-4">Product</div>
              <ul className="space-y-2 text-step-2 text-ink-2">
                <li>
                  <a href="#features" className="link-underline">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#stats" className="link-underline">
                    Impact
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="link-underline">
                    Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="eyebrow mb-4">Account</div>
              <ul className="space-y-2 text-step-2 text-ink-2">
                <li>
                  <Link to="/login" className="link-underline">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="link-underline">
                    Register
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="link-underline">
                    Forgot Password
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-step-1 text-ink-2 sm:flex-row">
            <div>© {new Date().getFullYear()} APES LMS. All rights reserved.</div>
            <div className="flex gap-5">
              <a href="#" className="link-underline">
                Privacy
              </a>
              <a href="#" className="link-underline">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
