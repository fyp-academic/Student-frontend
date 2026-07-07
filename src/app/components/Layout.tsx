import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router";
import { Sidebar } from "./Sidebar";
import AiWidget from "./AiWidget/AiWidget";
import { AiWidgetProvider } from "../context/AiWidgetContext";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { profileApi } from "../services/api";
import { telemetry } from "../services/telemetry";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import ThemeToggle from "./editorial/ThemeToggle";

const breadcrumbMap: Record<string, string> = {
  "": "Dashboard",
  instructors: "Instructors / My Instructors",
  sessions: "Live Sessions / Sessions",
  catalog: "Learning Catalog / Browse Courses",
  "my-courses": "My Courses / Enrolled List",
  lessons: "Learning Flow / Lesson Player",
  activities: "Learning Flow / Activities",
  assessments: "Learning Flow / Assessments",
  assignments: "Learning Flow / Assignments",
  "group-works": "Learning Flow / Group Works",
  practice: "Learning Flow / Practice",
  interactive: "Learning Flow / Interactive Activities",
  notifications: "Communication / Notifications",
  chat: "Communication / Chat",
  profile: "Account / Learner Profile",
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount: notifCount } = useRealtime();

  useEffect(() => {
    profileApi.get().then(r => {
      const p: Record<string, unknown> = r.data.data ?? r.data;
      setProfile(p);
    }).catch(() => {});
  }, []);

  // Track time-on-page per route. Pages with richer context (e.g. the lesson
  // player) override this with their own start() once their activity is known.
  useEffect(() => {
    telemetry.start({ resourceType: 'page', resourceId: null, courseId: null }, 'page_view');
  }, [location.pathname]);

  const profileImageUrl = profile?.profile_image_url as string | undefined;

  const pathKey = location.pathname.replace("/", "") || "";
  const breadcrumb = breadcrumbMap[pathKey] || "Dashboard";
  const parts = breadcrumb.split(" / ");

  const isLessonPlayer = location.pathname === '/lessons';

  return (
    <AiWidgetProvider>
    <>
      <style>{`
        @keyframes ringPulse {
          0% { transform: scale(0.95); opacity: 0.65; box-shadow: 0 0 0 0 rgba(181,97,61,0.45); }
          70% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(181,97,61,0); }
          100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(181,97,61,0); }
        }
      `}</style>
      <div
        className="flex h-screen overflow-hidden bg-white text-ink"
        style={{ fontFamily: '"Inter Variable", Inter, system-ui, sans-serif' }}
      >
        {!isLessonPlayer && (
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header — hidden on Lesson Player */}
        {!isLessonPlayer && (
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-line flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger - always visible on small screens */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-ink/5 transition-colors text-ink-2"
            >
              <Menu size={20} />
            </button>
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="hidden lg:block p-1.5 rounded-lg hover:bg-ink/5 transition-colors text-ink-2"
              >
                <Menu size={20} />
              </button>
            )}
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5">
              <NavLink to="/dashboard" className="text-clay hover:text-clay-deep transition-colors text-step-1">
                <LayoutDashboard size={14} className="inline mr-1" />
                Home
              </NavLink>
              {parts.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={13} className="text-ink-2/60" />
                  <span
                    className={`text-step-1 ${i === parts.length - 1 ? "text-ink font-semibold" : "text-ink-2"}`}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-2/70" />
              <input
                type="text"
                placeholder="Search courses, lessons..."
                className="pl-9 pr-4 py-2 rounded-full border border-line bg-paper text-ink placeholder-ink-2/70 text-step-1 focus:outline-none focus:ring-1 focus:ring-clay focus:border-clay transition-all"
                style={{ width: "240px" }}
              />
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NavLink to="/notifications" className="relative p-2 rounded-full hover:bg-ink/5 transition-colors text-ink-2">
              <Bell size={19} />
              {notifCount > 0 && (
                <span
                  className="absolute top-1 right-1 rounded-full bg-clay text-white flex items-center justify-center"
                  style={{ width: "16px", height: "16px", fontSize: "9px", fontWeight: 700 }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>

            {/* Avatar */}
            <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={String(profileImageUrl ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(String(user?.name ?? 'Student')) + '&background=b5613d&color=fff&size=80')}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-clay object-cover"
              />
              <div className="hidden md:block">
                <p className="text-step-1 font-semibold text-ink leading-tight">{user?.name ?? 'Student'}</p>
                <p className="text-ink-2 leading-tight" style={{ fontSize: "10px" }}>{user?.department ?? user?.role ?? 'Student'}</p>
              </div>
            </NavLink>
          </div>
        </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className={isLessonPlayer ? "" : "p-6"}>
            <Outlet />
          </div>
        </main>

        {/* AI Tutor Widget — auto-detects page context */}
        <AiWidget />
      </div>
    </div>
    </>
    </AiWidgetProvider>
  );
}
