'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

interface PerfData {
  overall_avg: number;
  pass_rate: number;
  total_quizzes: number;
  class_comparison: { cls: string; avg: number; quizzes: number }[];
}

export default function Performance() {
  const accessToken = useAppStore(state => state.accessToken);
  const [data, setData] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/teacher/performance', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Failed to fetch performance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

  const improvement = data ? Math.max(0, data.overall_avg - 65) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Performance Analytics</h1>
        <p className="text-slate-400 text-sm">Comprehensive performance tracking across all classes</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Avg" value={`${data?.overall_avg || 0}%`} icon={BarChart3} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: `${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}% this term`, positive: improvement > 0 }} delay={0.1} />
        <StatCard title="Pass Rate" value={`${data?.pass_rate || 0}%`} icon={TrendingUp} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="Above 60% threshold" delay={0.15} />
        <StatCard title="Total Quizzes" value={data?.total_quizzes || 0} icon={BarChart3} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="Across all classes" delay={0.2} />
        <StatCard title="Avg Improvement" value={`+${improvement.toFixed(0)}%`} icon={TrendingUp} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" subtitle="Since baseline" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Class Comparison" subtitle="Average performance per class" delay={0.35}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.class_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cls" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="avg" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} name="Average %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Quiz Count by Class" subtitle="Number of quiz submissions" delay={0.4}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.class_comparison || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cls" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="quizzes" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={32} name="Quizzes" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
