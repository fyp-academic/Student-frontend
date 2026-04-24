import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { notificationsApi, assignmentsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Rss,
  MessageSquare,
  TrendingUp,
  Zap,
  FileText,
  ClipboardList,
  HelpCircle,
  Target,
  MousePointerClick,
  Bell,
  MessageCircle,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ListChecks,
  Activity,
  Menu,
  X,
  BookMarked,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    id: "catalog",
    label: "Learning Catalog",
    icon: BookOpen,
    defaultOpen: true,
    items: [{ label: "Browse Courses", icon: Search, path: "/catalog" }],
  },
  {
    id: "my-courses",
    label: "My Courses",
    icon: GraduationCap,
    defaultOpen: true,
    items: [{ label: "Enrolled List", icon: ListChecks, path: "/my-courses" }],
  },
  {
    id: "course-spaces",
    label: "Course Spaces",
    icon: LayoutGrid,
    defaultOpen: true,
    items: [
      { label: "Course Feed", icon: Rss, path: "/course-feed" },
      { label: "Course Forum", icon: MessageSquare, path: "/course-forum" },
      { label: "Course Progress", icon: TrendingUp, path: "/course-progress" },
    ],
  },
  {
    id: "learning-flow",
    label: "Learning Flow",
    icon: Zap,
    defaultOpen: false,
    items: [
      { label: "Lessons", icon: BookMarked, path: "/lessons" },
      { label: "Activities", icon: Activity, path: "/activities" },
      { label: "Assessments", icon: ClipboardList, path: "/assessments" },
      { label: "Assignments", icon: FileText, path: "/assignments", badge: 0 },
      { label: "Quizzes", icon: HelpCircle, path: "/quizzes" },
      { label: "Practice", icon: Target, path: "/practice" },
      { label: "Interactive Activities", icon: MousePointerClick, path: "/interactive" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Bell,
    defaultOpen: true,
    items: [
      { label: "Notifications", icon: Bell, path: "/notifications", badge: 0 },
      { label: "Chat", icon: MessageCircle, path: "/chat" },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: UserCircle,
    defaultOpen: true,
    items: [{ label: "Learner Profile", icon: UserCircle, path: "/profile" }],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    navGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.defaultOpen ?? true }), {})
  );
  const [notifBadge, setNotifBadge]   = useState(0);
  const [assignBadge, setAssignBadge] = useState(0);

  useEffect(() => {
    notificationsApi.list().then(r => {
      const items: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      setNotifBadge(items.filter(n => !n.read).length);
    }).catch(() => {});
    assignmentsApi.mySubmissions({ status: 'pending' }).then(r => {
      const items: unknown[] = r.data.data ?? r.data ?? [];
      setAssignBadge(items.length);
    }).catch(() => {});
  }, []);

  const getDynamicBadge = (path: string, staticBadge?: number): number | undefined => {
    if (path === '/notifications') return notifBadge || undefined;
    if (path === '/assignments')   return assignBadge || undefined;
    return staticBadge || undefined;
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? "70px" : "268px",
        backgroundColor: "#0c1e4a",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl w-9 h-9 flex-shrink-0"
              style={{ backgroundColor: "#22c55e" }}
            >
              <GraduationCap size={20} color="white" />
            </div>
            <div>
              <p className="text-white" style={{ fontSize: "13px", fontWeight: 700, lineHeight: "1.2" }}>
                UniLearn LMS
              </p>
              <p style={{ fontSize: "10px", color: "#93c5fd" }}>University Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex items-center justify-center rounded-xl w-9 h-9" style={{ backgroundColor: "#22c55e" }}>
            <GraduationCap size={20} color="white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10 text-blue-300 transition-colors">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Collapse toggle when sidebar is collapsed */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-2 p-2 rounded-md hover:bg-white/10 text-blue-300 transition-colors"
        >
          <Menu size={18} />
        </button>
      )}

      {/* Dashboard Home Link */}
      <div className="px-3 pt-3 pb-1">
        <NavLink
          to="/"
          end
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
          style={({ isActive }) => ({
            backgroundColor: isActive ? "rgba(34,197,94,0.18)" : "transparent",
            borderLeft: isActive ? "2px solid #22c55e" : "2px solid transparent",
            paddingLeft: isActive ? "10px" : "12px",
          })}
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard size={18} color={isActive ? "#22c55e" : "#93c5fd"} className="flex-shrink-0" />
              {!collapsed && (
                <span style={{ fontSize: "13px", color: isActive ? "#ffffff" : "#bfdbfe", fontWeight: isActive ? 600 : 400 }}>
                  Dashboard
                </span>
              )}
            </>
          )}
        </NavLink>
      </div>

      {/* Scrollable Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "none" }}>
        {navGroups.map((group) => (
          <div key={group.id} className="mb-1">
            {/* Group Header */}
            <button
              onClick={() => !collapsed && toggleGroup(group.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-white/5 mt-1"
              title={collapsed ? group.label : undefined}
            >
              <group.icon
                size={16}
                style={{ color: "#60a5fa", flexShrink: 0 }}
              />
              {!collapsed && (
                <>
                  <span
                    className="flex-1 text-left truncate"
                    style={{ fontSize: "11px", color: "#60a5fa", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                  >
                    {group.label}
                  </span>
                  {openGroups[group.id] ? (
                    <ChevronDown size={13} color="#4b72b0" />
                  ) : (
                    <ChevronRight size={13} color="#4b72b0" />
                  )}
                </>
              )}
            </button>

            {/* Group Items */}
            {(!collapsed && openGroups[group.id]) && (
              <div className="ml-1 mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "rgba(34,197,94,0.15)" : "transparent",
                      borderLeft: isActive ? "2px solid #22c55e" : "2px solid transparent",
                      paddingLeft: isActive ? "10px" : "12px",
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={15} color={isActive ? "#22c55e" : "#93c5fd"} className="flex-shrink-0" />
                        <span
                          className="flex-1 truncate"
                          style={{ fontSize: "13px", color: isActive ? "#ffffff" : "#bfdbfe", fontWeight: isActive ? 600 : 400 }}
                        >
                          {item.label}
                        </span>
                        {getDynamicBadge(item.path, item.badge) ? (
                          <span
                            className="flex-shrink-0 text-white rounded-full px-1.5 py-0.5"
                            style={{ fontSize: "10px", backgroundColor: "#22c55e", fontWeight: 700, minWidth: "18px", textAlign: "center" }}
                          >
                            {getDynamicBadge(item.path, item.badge)}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}

            {/* Collapsed mode: individual icon links */}
            {collapsed && (
              <div className="space-y-0.5 mt-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className="flex items-center justify-center py-2 rounded-lg transition-all relative"
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "rgba(34,197,94,0.15)" : "transparent",
                    })}
                  >
                    {({ isActive }) => (
                      <div className="relative">
                        <item.icon size={17} color={isActive ? "#22c55e" : "#93c5fd"} />
                        {getDynamicBadge(item.path, item.badge) ? (
                          <span
                            className="absolute -top-1 -right-1 text-white rounded-full flex items-center justify-center"
                            style={{ fontSize: "8px", backgroundColor: "#22c55e", width: "13px", height: "13px" }}
                          >
                            {getDynamicBadge(item.path, item.badge)}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t p-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 border-2" style={{ borderColor: "#22c55e" }}>
            {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white truncate" style={{ fontSize: "12px", fontWeight: 600 }}>{user?.name ?? 'Student'}</p>
              <p className="truncate" style={{ fontSize: "11px", color: "#60a5fa" }}>{user?.department ?? user?.role ?? 'Student'}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-lg hover:bg-white/10 text-blue-300 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
