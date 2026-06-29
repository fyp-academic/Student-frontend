import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router";
import { notificationsApi, assignmentsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Zap,
  FileText,
  Bell,
  MessageCircle,
  UserCircle,
  ChevronDown,
  ChevronRight,
  Search,
  ListChecks,
  Menu,
  X,
  BookMarked,
  LogOut,
  Check,
  Trash2,
  FileText as IconFileText,
  HelpCircle as IconHelpCircle,
  MessageCircle as IconMessageCircle,
  Award,
  AlertCircle,
  CheckCircle,
  Users,
  Video,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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

type NotifType = "assignment" | "quiz" | "message" | "achievement" | "reminder" | "announcement" | "grade" | "info" | "warning" | "success" | "danger" | "course_update";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  message?: string;
  time: string;
  timestamp?: string;
  read: boolean;
  course?: string;
  courseColor?: string;
}

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  assignment:   { icon: IconFileText,   color: "#2563eb", bg: "#eff6ff" },
  quiz:         { icon: IconHelpCircle, color: "#7c3aed", bg: "#fdf4ff" },
  message:      { icon: IconMessageCircle, color: "#0891b2", bg: "#f0fdfa" },
  achievement:  { icon: Award,          color: "#f59e0b", bg: "#fffbeb" },
  reminder:     { icon: AlertCircle,    color: "#dc2626", bg: "#fef2f2" },
  announcement: { icon: Bell,           color: "#475569", bg: "#f8fafc" },
  grade:        { icon: CheckCircle,    color: "#16a34a", bg: "#f0fdf4" },
  info:         { icon: Bell,           color: "#2563eb", bg: "#eff6ff" },
  warning:      { icon: AlertCircle,    color: "#f59e0b", bg: "#fffbeb" },
  success:      { icon: CheckCircle,    color: "#16a34a", bg: "#f0fdf4" },
  danger:       { icon: AlertCircle,    color: "#dc2626", bg: "#fef2f2" },
  course_update:{ icon: Bell,           color: "#7c3aed", bg: "#fdf4ff" },
};

const MAX_DROPDOWN_NOTIFICATIONS = 6;

const navGroups: NavGroup[] = [
  {
    id: "catalog",
    label: "Learning Catalog",
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { label: "Browse Courses", icon: Search, path: "/catalog" },
      { label: "Instructors", icon: Users, path: "/instructors" },
    ],
  },
  {
    id: "my-courses",
    label: "My Courses",
    icon: GraduationCap,
    defaultOpen: true,
    items: [{ label: "Enrolled List", icon: ListChecks, path: "/my-courses" }],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: Calendar,
    defaultOpen: true,
    items: [{ label: "Calendar", icon: Calendar, path: "/calendar" }],
  },
  {
    id: "learning-flow",
    label: "Learning Flow",
    icon: Zap,
    defaultOpen: true,
    items: [
      { label: "Lessons", icon: BookMarked, path: "/lessons" },
      { label: "Group Works", icon: Users, path: "/group-works" },
      { label: "Grade Book", icon: Award, path: "/grade-book" },
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
  {
    id: "engagement",
    label: "My Engagement",
    icon: TrendingUp,
    defaultOpen: true,
    items: [{ label: "Engagement & AI Tips", icon: TrendingUp, path: "/engagement" }],
  },
];

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    navGroups.reduce((acc, g) => ({ ...acc, [g.id]: g.defaultOpen ?? true }), {})
  );
  const [notifBadge, setNotifBadge]   = useState(0);
  const [assignBadge, setAssignBadge] = useState(0);
  
  // Notification dropdown state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch notifications for badge and dropdown
  const fetchNotifications = () => {
    setLoadingNotifs(true);
    notificationsApi.list().then(r => {
      const raw: Record<string, unknown>[] = r.data.data ?? r.data ?? [];
      const mapped = raw.map(n => ({
        id: String(n.id),
        type: (n.type as NotifType) ?? 'info',
        title: String(n.title ?? ''),
        body: String(n.message ?? n.body ?? ''),
        time: String(n.timestamp ?? n.created_at ?? ''),
        read: Boolean(n.read),
        course: n.course as string | undefined,
        courseColor: n.course_color as string | undefined,
      }));
      setNotifications(mapped);
      setNotifBadge(mapped.filter(n => !n.read).length);
    }).catch(() => {}).finally(() => setLoadingNotifs(false));
  };

  useEffect(() => {
    fetchNotifications();
    assignmentsApi.mySubmissions({ status: 'pending' }).then(r => {
      const items: unknown[] = r.data.data ?? r.data ?? [];
      setAssignBadge(items.length);
    }).catch(() => {});

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifDropdown]);

  const markRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).then(() => {
      setNotifBadge(prev => Math.max(0, prev - 1));
    }).catch(() => {});
  };

  const markAllRead = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationsApi.markAllRead().then(() => {
      setNotifBadge(0);
    }).catch(() => {});
  };

  const deleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const notif = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notif && !notif.read) {
      setNotifBadge(prev => Math.max(0, prev - 1));
    }
    notificationsApi.remove(id).catch(() => {});
  };

  const toggleNotifDropdown = () => {
    if (!showNotifDropdown) {
      fetchNotifications();
    }
    setShowNotifDropdown(!showNotifDropdown);
  };

  const getDynamicBadge = (path: string, staticBadge?: number): number | undefined => {
    if (path === '/notifications') return notifBadge || undefined;
    if (path === '/assignments')   return assignBadge || undefined;
    return staticBadge || undefined;
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`flex flex-col h-screen transition-all duration-300 flex-shrink-0 fixed lg:static z-50
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
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
                APES LMS
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
          <div className="flex items-center gap-2">
            <button onClick={onToggle} className="p-1 rounded-md hover:bg-white/10 text-blue-300 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle when sidebar is collapsed */}
      {collapsed && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-white/10 text-blue-300 transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>
      )}

      {/* Dashboard Home Link */}
      <div className="px-3 pt-3 pb-1">
          <NavLink
            to="/dashboard"
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

      {/* Live Sessions Link */}
      <div className="px-3 pb-1">
          <NavLink
            to="/sessions"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
            style={({ isActive }) => ({
              backgroundColor: isActive ? "rgba(34,197,94,0.18)" : "transparent",
              borderLeft: isActive ? "2px solid #22c55e" : "2px solid transparent",
              paddingLeft: isActive ? "10px" : "12px",
            })}
          >
            {({ isActive }) => (
              <>
                <Video size={18} color={isActive ? "#22c55e" : "#93c5fd"} className="flex-shrink-0" />
                {!collapsed && (
                  <span style={{ fontSize: "13px", color: isActive ? "#ffffff" : "#bfdbfe", fontWeight: isActive ? 600 : 400 }}>
                    Live Sessions
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
          <img
            src={String(user?.profile_image_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(String(user?.name ?? 'Student'))}&background=2563eb&color=fff&size=100`)}
            alt={String(user?.name ?? 'Student')}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2"
            style={{ borderColor: "#22c55e" }}
          />
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
    </>
  );
}
