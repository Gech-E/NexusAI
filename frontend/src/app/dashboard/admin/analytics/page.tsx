'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const tt = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };
const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

interface AnalyticsData {
  users_by_role: Record<string, number>;
  total_users: number;
  total_institutions: number;
  total_courses: number;
  total_attempts: number;
  completed_attempts: number;
  completion_rate: number;
  avg_score: number;
}

export default function AdminAnalytics() {
  const accessToken = useAppStore(state => state.accessToken);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/analytics', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;

  const rolePieData = data ? Object.entries(data.users_by_role).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Platform Analytics</h1>
        <p className="text-slate-400 text-sm">Cross-institutional engagement and performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data?.total_users || 0} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10 border-blue-500/20" subtitle={`${data?.total_institutions || 0} institutions`} delay={0.1} />
        <StatCard title="Total Attempts" value={data?.total_attempts || 0} icon={Activity} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle={`${data?.completed_attempts || 0} completed`} delay={0.15} />
        <StatCard title="Avg Score" value={`${data?.avg_score || 0}%`} icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" subtitle="Across all quizzes" delay={0.2} />
        <StatCard title="Completion Rate" value={`${data?.completion_rate || 0}%`} icon={BarChart3} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle={`${data?.total_courses || 0} courses`} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Users by Role" subtitle="Distribution of platform users" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {rolePieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
              <Tooltip contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform Summary" subtitle="Key metrics overview" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { metric: 'Users', value: data?.total_users || 0 },
              { metric: 'Courses', value: data?.total_courses || 0 },
              { metric: 'Attempts', value: data?.total_attempts || 0 },
              { metric: 'Completed', value: data?.completed_attempts || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="metric" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
