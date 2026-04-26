import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";
import { profileApi } from "../services/api";
import {
  Bell,
  Search,
  Menu,
  ChevronRight,
  LayoutDashboard,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const breadcrumbMap: Record<string, string> = {
  "": "Dashboard",
  catalog: "Learning Catalog / Browse Courses",
  "my-courses": "My Courses / Enrolled List",
  "course-feed": "Course Spaces / Course Feed",
  "course-forum": "Course Spaces / Course Forum",
  "course-progress": "Course Spaces / Course Progress",
  lessons: "Learning Flow / Lessons",
  activities: "Learning Flow / Activities",
  assessments: "Learning Flow / Assessments",
  assignments: "Learning Flow / Assignments",
  quizzes: "Learning Flow / Quizzes",
  practice: "Learning Flow / Practice",
  interactive: "Learning Flow / Interactive Activities",
  notifications: "Communication / Notifications",
  chat: "Communication / Chat",
  profile: "Account / Learner Profile",
};

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiGuideOpen, setAiGuideOpen] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const location = useLocation();
  const { user } = useAuth();

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

  return (
    <>
      <style>{`
        @keyframes ringPulse {
          0% { transform: scale(0.95); opacity: 0.65; box-shadow: 0 0 0 0 rgba(34,197,94,0.45); }
          70% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(34,197,94,0); }
          100% { transform: scale(1.4); opacity: 0; box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
      `}</style>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#f0f5ff" }}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
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
              <span
                className="absolute top-1 right-1 rounded-full text-white flex items-center justify-center"
                style={{ width: "16px", height: "16px", fontSize: "9px", backgroundColor: "#22c55e", fontWeight: 700 }}
              >
                5
              </span>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>
          <div className="p-6">
            <Outlet />
          </div>
        </main>

        {/* AI Guide Bubble */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {aiGuideOpen && (
            <div
              className="w-72 rounded-2xl p-4 bg-white"
              style={{ boxShadow: "0 15px 40px rgba(37,99,235,0.2)", border: "1px solid #dbeafe" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="p-2 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)" }}
                >
                  <Sparkles size={16} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>AI Learning Companion</p>
                  <p style={{ fontSize: "11px", color: "#64748b" }}>Personalized nudges in real time</p>
                </div>
              </div>
              <ul className="space-y-2" style={{ fontSize: "12px", color: "#475569" }}>
                <li>• Adapts to your pace & style</li>
                <li>• Highlights gaps from prior knowledge</li>
                <li>• Flags at-risk moments early</li>
                <li>• Suggests study plans & next lessons</li>
              </ul>
              <button
                className="mt-3 w-full py-2 rounded-xl text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
              >
                Open Smart Chat
              </button>
            </div>
          )}

          <button
            onClick={() => setAiGuideOpen((prev) => !prev)}
            className="relative w-12 h-12 rounded-full shadow-2xl flex items-center justify-center"
            style={{
              background: aiGuideOpen ? "linear-gradient(135deg, #1d4ed8, #1e40af)" : "linear-gradient(135deg, #2563eb, #3b82f6)",
              boxShadow: "0 12px 32px rgba(37,99,235,0.35)",
            }}
            aria-label="Open AI learning companion"
          >
            <div className="text-white">
              <MessageCircle size={22} />
            </div>
            <span
              className="absolute -top-1 -right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: "#22c55e", boxShadow: "0 0 0 2px #f0f5ff" }}
            >
              AI
            </span>
            <span
              className="absolute inset-0 rounded-full border border-white/30"
              style={{ boxShadow: "0 0 15px rgba(255,255,255,0.35)" }}
            />
            <span
              className="absolute -inset-1.5 rounded-full pointer-events-none"
              style={{ border: "2px solid rgba(34,197,94,0.45)", animation: "ringPulse 2.2s ease-out infinite" }}
            />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
