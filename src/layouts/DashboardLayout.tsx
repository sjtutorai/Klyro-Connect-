import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Building2, Users, GraduationCap, 
  BookOpen, Calendar, Bell, FileBarChart, MessageSquareWarning, MessagesSquare,
  Settings, LogOut, Menu, X, Sun, Moon, Search, ChevronLeft, ChevronRight,
  Shield, Sparkles, Check, ExternalLink, UserCircle, UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

const ROLE_NAVS = {
  SUPER_ADMIN: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/super-admin' },
    { name: 'Institutions', icon: Building2, path: '/dashboard/super-admin/institutions' },
    { name: 'Analytics', icon: FileBarChart, path: '/dashboard/super-admin/analytics' },
    { name: 'Settings', icon: Settings, path: '/dashboard/super-admin/settings' },
  ],
  INSTITUTION: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/institution' },
    { name: 'Requests', icon: UserCheck, path: '/dashboard/institution/requests' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/institution/study-groups' },
    { name: 'Classes & Sections', icon: BookOpen, path: '/dashboard/institution/classes' },
    { name: 'Teachers', icon: Users, path: '/dashboard/institution/teachers' },
    { name: 'Students', icon: GraduationCap, path: '/dashboard/institution/students' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/institution/timetable' },
    { name: 'Communications', icon: Bell, path: '/dashboard/institution/communications' },
    { name: 'Settings', icon: Settings, path: '/dashboard/institution/settings' },
  ],
  TEACHER: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/teacher' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/teacher/study-groups' },
    { name: 'My Students', icon: Users, path: '/dashboard/teacher/students' },
    { name: 'Homework', icon: BookOpen, path: '/dashboard/teacher/homework' },
    { name: 'Attendance', icon: Calendar, path: '/dashboard/teacher/attendance' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/teacher/timetable' },
    { name: 'Communications', icon: Bell, path: '/dashboard/teacher/communications' },
  ],
  STUDENT: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/student' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/student/study-groups' },
    { name: 'Homework', icon: BookOpen, path: '/dashboard/student/homework' },
    { name: 'Attendance', icon: Calendar, path: '/dashboard/student/attendance' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/student/timetable' },
    { name: 'Communications', icon: Bell, path: '/dashboard/student/communications' },
  ]
};

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New Notice Published', time: '10m ago', unread: true },
  { id: '2', title: 'Homework Assignment Uploaded', time: '1h ago', unread: true },
  { id: '3', title: 'Weekly Timetable Updated', time: '3h ago', unread: false },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  if (!user) return null;

  const navigation = ROLE_NAVS[user.role] || [];
  const unreadCount = notifications.filter(n => n.unread).length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300' };
      case 'INSTITUTION': return { label: 'Main Institution', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300' };
      case 'TEACHER': return { label: 'Faculty', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' };
      default: return { label: 'Student', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          "hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 sticky top-0 h-screen transition-all duration-300 z-30 shadow-sm",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Klyro Connect <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-1">
                  Campus OS
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Institution Badge */}
        {!isSidebarCollapsed && (
          <div className="mx-4 mt-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                {user.institutionName || 'Klyro Campus Hub'}
              </p>
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                {roleInfo.label}
              </p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 scrollbar-none">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== `/dashboard/${user.role.toLowerCase()}`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all duration-150 group',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 dark:bg-indigo-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={clsx('w-5 h-5 shrink-0', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300')} />
                {!isSidebarCollapsed && <span className="truncate flex-1">{item.name}</span>}
                {!isSidebarCollapsed && item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer User Card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
          {!isSidebarCollapsed ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-3 flex justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Sticky Top Header */}
        <header className="h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 shrink-0">
          
          {/* Left Search & Mobile Toggle */}
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Search Bar */}
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search classes, students, notices, events..."
                className="w-full pl-10 pr-12 py-2 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Campus Notifications</h4>
                      <button
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div key={n.id} className={clsx("p-2.5 rounded-xl text-xs flex items-start justify-between gap-2", n.unread ? "bg-indigo-50/70 dark:bg-indigo-950/50" : "bg-slate-50 dark:bg-slate-800/40")}>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                          </div>
                          {n.unread && <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Role Chip */}
            <span className={clsx("hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", roleInfo.color)}>
              <Shield className="w-3 h-3" />
              {roleInfo.label}
            </span>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {user.name?.charAt(0) || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 space-y-1"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to={`/dashboard/${user.role.toLowerCase()}/settings`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-400" /> Account Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Dynamic Page Outlet with scrollable container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800 lg:hidden"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">Klyro Connect AI</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all',
                      location.pathname === item.path
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-100 transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
