'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, LayoutDashboard, BookOpen, FileText, TrendingUp,
  LogOut, ChevronLeft, Menu, Users,
  Activity, AlertTriangle, GraduationCap, Lightbulb,
  WifiOff, MonitorSmartphone, BarChart3, Building2, DollarSign,
  Target, X
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const studentNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/student', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'AI Tutor', href: '/dashboard/student/ai-tutor', icon: <BrainCircuit className="w-5 h-5" /> },
  { label: 'Courses', href: '/dashboard/student/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Quizzes', href: '/dashboard/student/quizzes', icon: <FileText className="w-5 h-5" /> },
  { label: 'Analytics', href: '/dashboard/student/analytics', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'Recommendations', href: '/dashboard/student/recommendations', icon: <Lightbulb className="w-5 h-5" /> },
  { label: 'Practice Exams', href: '/dashboard/student/practice-exams', icon: <Target className="w-5 h-5" /> },
  { label: 'Offline Sync', href: '/dashboard/student/sync-status', icon: <WifiOff className="w-5 h-5" /> },
];

const teacherNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/teacher', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Students', href: '/dashboard/teacher/students', icon: <Users className="w-5 h-5" /> },
  { label: 'Exams', href: '/dashboard/teacher/exams', icon: <FileText className="w-5 h-5" /> },
  { label: 'AI Insights', href: '/dashboard/teacher/ai-insights', icon: <BrainCircuit className="w-5 h-5" /> },
  { label: 'Weak Topics', href: '/dashboard/teacher/weak-topics', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'Performance', href: '/dashboard/teacher/performance', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Classes', href: '/dashboard/teacher/classes', icon: <GraduationCap className="w-5 h-5" /> },
];

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'Institutions', href: '/dashboard/admin/institutions', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Users', href: '/dashboard/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'AI Monitor', href: '/dashboard/admin/ai-monitor', icon: <MonitorSmartphone className="w-5 h-5" /> },
  { label: 'System Health', href: '/dashboard/admin/system-health', icon: <Activity className="w-5 h-5" /> },
  { label: 'Revenue', href: '/dashboard/admin/revenue', icon: <DollarSign className="w-5 h-5" /> },
];

function getRoleConfig(role: string) {
  switch (role) {
    case 'teacher':
      return { items: teacherNavItems, accent: 'emerald', label: 'Teacher' };
    case 'admin':
      return { items: adminNavItems, accent: 'purple', label: 'Admin' };
    default:
      return { items: studentNavItems, accent: 'cyan', label: 'Student' };
  }
}

const accentMap: Record<string, { bg: string; text: string; border: string; hover: string; gradient: string }> = {
  cyan: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    hover: 'hover:bg-cyan-500/10',
    gradient: 'from-cyan-500 to-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    hover: 'hover:bg-emerald-500/10',
    gradient: 'from-emerald-500 to-teal-600',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    hover: 'hover:bg-purple-500/10',
    gradient: 'from-purple-500 to-indigo-600',
  },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);

  const role = user?.role || 'student';
  const config = getRoleConfig(role);
  const colors = accentMap[config.accent];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === `/dashboard/${role}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-5 border-b border-slate-800`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shrink-0`}>
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold text-white whitespace-nowrap"
            >
              Nexus<span className={colors.text}>AI</span>
            </motion.span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors hidden lg:flex"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {config.items.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${active
                  ? `${colors.bg} ${colors.text} ${colors.border} border`
                  : `text-slate-400 hover:text-white ${colors.hover} border border-transparent`
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <span className={`shrink-0 ${active ? colors.text : 'text-slate-500 group-hover:text-slate-300'}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 shadow-xl transition-opacity">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/30 mt-2">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {(user?.firstName || user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName || user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{config.label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] flex">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-full bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 z-40"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[260px] bg-slate-950 border-r border-slate-800 z-50 lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 min-h-screen hidden lg:block"
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-white">
                {config.items.find(i => isActive(i.href))?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </motion.main>

      {/* Mobile Layout */}
      <div className="flex-1 min-h-screen lg:hidden">
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BrainCircuit className={`w-6 h-6 ${colors.text}`} />
            <span className="text-sm font-bold text-white">NexusAI</span>
          </div>
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white font-bold text-xs`}>
            {(user?.firstName || 'U').charAt(0).toUpperCase()}
          </div>
        </header>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
