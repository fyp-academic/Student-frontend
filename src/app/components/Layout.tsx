import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router";
import { Sidebar } from "./Sidebar";
import AiWidget from "./AiWidget/AiWidget";
import { AiWidgetProvider } from "../context/AiWidgetContext";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { profileApi } from "../services/api";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

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
          0% { transform: scale(0.95); opacity: 0.65; box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
          70% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(34,197,94,0); }
          100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
      `}</style>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f0f5ff" }}>
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
        <header
          className="flex items-center justify-between px-6 py-3 bg-white border-b flex-shrink-0"
          style={{ borderColor: "#e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger - always visible on small screens */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
            >
              <Menu size={20} />
            </button>
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="hidden lg:block p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                <Menu size={20} />
              </button>
            )}
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5">
              <NavLink to="/" className="text-blue-600 hover:text-blue-700 transition-colors" style={{ fontSize: "13px" }}>
                <LayoutDashboard size={14} className="inline mr-1" />
                Home
              </NavLink>
              {parts.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={13} color="#94a3b8" />
                  <span
                    style={{
                      fontSize: "13px",
                      color: i === parts.length - 1 ? "#1e40af" : "#64748b",
                      fontWeight: i === parts.length - 1 ? 600 : 400,
                    }}
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
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses, lessons..."
                className="pl-9 pr-4 py-2 rounded-lg border bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                style={{ fontSize: "13px", borderColor: "#e2e8f0", width: "240px" }}
              />
            </div>

            {/* Notification Bell */}
            <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell size={19} color="#475569" />
              {notifCount > 0 && (
                <span
                  className="absolute top-1 right-1 rounded-full text-white flex items-center justify-center"
                  style={{ width: "16px", height: "16px", fontSize: "9px", backgroundColor: "#22c55e", fontWeight: 700 }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>

            {/* Avatar */}
            <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={String(profileImageUrl ?? 'https://ui-avatars.com/api/?name=' + encodeURIComponent(String(user?.name ?? 'Student')) + '&background=2563eb&color=fff&size=80')}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 object-cover"
                style={{ borderColor: "#2563eb" }}
              />
              <div className="hidden md:block">
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>{user?.name ?? 'Student'}</p>
                <p style={{ fontSize: "10px", color: "#64748b" }}>{user?.department ?? user?.role ?? 'Student'}</p>
              </div>
            </NavLink>
          </div>
        </header>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: isLessonPlayer ? "#f8fafc" : "#f0f5ff" }}>
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
