'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const engagementData = [
  { day: 'Mon', logins: 320, queries: 890 }, { day: 'Tue', logins: 410, queries: 1120 },
  { day: 'Wed', logins: 380, queries: 980 }, { day: 'Thu', logins: 450, queries: 1340 },
  { day: 'Fri', logins: 390, queries: 1050 }, { day: 'Sat', logins: 210, queries: 560 },
  { day: 'Sun', logins: 180, queries: 420 },
];

const coursePerformance = [
  { course: 'Math 10A', avg: 78 }, { course: 'Physics 11', avg: 72 },
  { course: 'Chem 10', avg: 68 }, { course: 'Bio 11', avg: 82 },
  { course: 'English 10', avg: 85 }, { course: 'History 11', avg: 74 },
];

const tt = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function AdminAnalytics() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Platform Analytics</h1>
        <p className="text-slate-400 text-sm">Cross-institutional engagement and performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Daily Active Users" value="342" icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10 border-blue-500/20" trend={{ value: '+12% vs yesterday', positive: true }} delay={0.1} />
        <StatCard title="AI Queries Today" value="4,291" icon={Activity} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="Avg 12.5 per user" delay={0.15} />
        <StatCard title="Avg Session" value="28 min" icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: '+3 min vs last week', positive: true }} delay={0.2} />
        <StatCard title="Completion Rate" value="76%" icon={BarChart3} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" trend={{ value: '+5% this month', positive: true }} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Weekly Engagement" subtitle="Logins and AI queries per day" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="loginGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tt} />
              <Area type="monotone" dataKey="logins" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#loginGrad)" name="Logins" />
              <Area type="monotone" dataKey="queries" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={0} strokeDasharray="4 4" name="AI Queries" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Course Performance" subtitle="Average scores across all institutions" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={coursePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="course" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="avg" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} name="Average %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
