import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, Users, GraduationCap, 
  BookOpen, Calendar, Bell, FileBarChart, MessageSquareWarning, MessagesSquare,
  Settings, LogOut, Menu, X 
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

const ROLE_NAVS = {
  SUPER_ADMIN: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/super-admin' },
    { name: 'Institutions', icon: Building2, path: '/dashboard/super-admin/institutions' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/super-admin/study-groups' },
    { name: 'Analytics', icon: FileBarChart, path: '/dashboard/super-admin/analytics' },
    { name: 'Settings', icon: Settings, path: '/dashboard/super-admin/settings' },
  ],
  INSTITUTION: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/institution' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/institution/study-groups' },
    { name: 'Teachers', icon: Users, path: '/dashboard/institution/teachers' },
    { name: 'Students', icon: GraduationCap, path: '/dashboard/institution/students' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/institution/timetable' },
    { name: 'Events', icon: Calendar, path: '/dashboard/institution/events' },
    { name: 'Notices', icon: Bell, path: '/dashboard/institution/notices' },
    { name: 'Reports', icon: FileBarChart, path: '/dashboard/institution/reports' },
    { name: 'Complaints', icon: MessageSquareWarning, path: '/dashboard/institution/complaints' },
    { name: 'Settings', icon: Settings, path: '/dashboard/institution/settings' },
  ],
  TEACHER: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/teacher' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/teacher/study-groups' },
    { name: 'My Students', icon: Users, path: '/dashboard/teacher/students' },
    { name: 'Events', icon: Calendar, path: '/dashboard/teacher/events' },
    { name: 'Homework', icon: BookOpen, path: '/dashboard/teacher/homework' },
    { name: 'Attendance', icon: Calendar, path: '/dashboard/teacher/attendance' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/teacher/timetable' },
    { name: 'Notices', icon: Bell, path: '/dashboard/teacher/notices' },
    { name: 'Complaints', icon: MessageSquareWarning, path: '/dashboard/teacher/complaints' },
  ],
  STUDENT: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/student' },
    { name: 'Study Groups', icon: MessagesSquare, path: '/dashboard/student/study-groups' },
    { name: 'Events', icon: Calendar, path: '/dashboard/student/events' },
    { name: 'Homework', icon: BookOpen, path: '/dashboard/student/homework' },
    { name: 'Attendance', icon: Calendar, path: '/dashboard/student/attendance' },
    { name: 'Timetable', icon: Calendar, path: '/dashboard/student/timetable' },
    { name: 'Notices', icon: Bell, path: '/dashboard/student/notices' },
    { name: 'Complaints', icon: MessageSquareWarning, path: '/dashboard/student/complaints' },
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigation = ROLE_NAVS[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">VAKS <span className="text-indigo-600">AI</span></span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== `/dashboard/${user.role.toLowerCase()}`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={clsx('w-5 h-5', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VAKS AI</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-xl lg:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
                <span className="text-xl font-bold text-slate-900">Menu</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium',
                      location.pathname === item.path ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
