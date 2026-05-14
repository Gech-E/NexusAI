'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Play, TrendingUp, Loader2, Target, Lightbulb, WifiOff, Zap } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { AITutor } from '@/components/AITutor';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const weeklyData = [
  { day: 'Mon', score: 72, sessions: 3 },
  { day: 'Tue', score: 78, sessions: 4 },
  { day: 'Wed', score: 65, sessions: 2 },
  { day: 'Thu', score: 82, sessions: 5 },
  { day: 'Fri', score: 88, sessions: 4 },
  { day: 'Sat', score: 91, sessions: 6 },
  { day: 'Sun', score: 85, sessions: 3 },
];

const skillsData = [
  { subject: 'Math', mastery: 82 },
  { subject: 'Physics', mastery: 68 },
  { subject: 'Chemistry', mastery: 74 },
  { subject: 'Biology', mastery: 90 },
  { subject: 'English', mastery: 85 },
];

interface DashboardStats {
  skill_mastery: number;
  completed_quizzes: number;
  active_offline: boolean;
  weekly_improvement: number;
  pending_assignments: number;
  ai_sessions_hours: number;
}

export default function StudentDashboard() {
  const user = useAppStore(state => state.user);
  const accessToken = useAppStore(state => state.accessToken);
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('http://localhost:8000/api/v1/analytics/me/summary', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism p-8 rounded-3xl bg-gradient-to-br from-cyan-900/30 to-slate-900/30 border-cyan-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-cyan-300 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            AI Engine Active
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.firstName || 'Student'}!</h1>
          <p className="text-slate-400 max-w-xl mb-6">
            Your local AI Tutor is initialized and ready. You have {stats?.pending_assignments || 0} pending assignments and your skills are trending up.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/dashboard/student/courses')}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-6 py-3 rounded-full flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" /> Resume Learning
            </button>
            <button
              onClick={() => router.push('/dashboard/student/quizzes')}
              className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 transition-colors border border-slate-700"
            >
              <Target className="w-4 h-4" /> Take a Quiz
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Skill Mastery"
          value={`${stats?.skill_mastery || 0}%`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          trend={{ value: `+${stats?.weekly_improvement || 0}% this week`, positive: true }}
          delay={0.1}
          onClick={() => router.push('/dashboard/student/analytics')}
        />
        <StatCard
          title="Completed Quizzes"
          value={stats?.completed_quizzes || 0}
          icon={BookOpen}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10 border-purple-500/20"
          subtitle={`${stats?.pending_assignments || 0} remaining`}
          delay={0.15}
          onClick={() => router.push('/dashboard/student/quizzes')}
        />
        <StatCard
          title="AI Tutor Sessions"
          value={`${stats?.ai_sessions_hours || 0} hrs`}
          icon={BrainCircuit}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10 border-cyan-500/20"
          subtitle={stats?.active_offline ? 'Active offline' : 'Online mode'}
          delay={0.2}
        />
        <StatCard
          title="Learning Streak"
          value="7 days"
          icon={Zap}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          trend={{ value: 'Personal best!', positive: true }}
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Performance" subtitle="Score trend over the last 7 days" delay={0.3}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#scoreGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subject Mastery" subtitle="Proficiency across enrolled subjects" delay={0.35}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={skillsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <YAxis dataKey="subject" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={70} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="mastery" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'AI Tutor Chat', desc: 'Get help with any topic', icon: BrainCircuit, color: 'cyan', href: '/dashboard/student/ai-tutor' },
            { label: 'Recommendations', desc: 'AI-suggested lessons', icon: Lightbulb, color: 'amber', href: '/dashboard/student/recommendations' },
            { label: 'Practice Exam', desc: 'Adaptive difficulty', icon: Target, color: 'purple', href: '/dashboard/student/practice-exams' },
            { label: 'Sync Status', desc: 'Check offline data', icon: WifiOff, color: 'emerald', href: '/dashboard/student/sync-status' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="glassmorphism p-5 rounded-2xl text-left hover:border-slate-600 transition-all group"
            >
              <action.icon className={`w-6 h-6 text-${action.color}-400 mb-3 group-hover:scale-110 transition-transform`} />
              <p className="text-white font-medium text-sm">{action.label}</p>
              <p className="text-slate-500 text-xs mt-1">{action.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      <AITutor />
    </div>
  );
}
