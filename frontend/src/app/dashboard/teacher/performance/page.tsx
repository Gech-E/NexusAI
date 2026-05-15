'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const monthlyPerf = [
  { month: 'Sep', avg: 65 }, { month: 'Oct', avg: 68 }, { month: 'Nov', avg: 72 },
  { month: 'Dec', avg: 70 }, { month: 'Jan', avg: 75 }, { month: 'Feb', avg: 78 },
  { month: 'Mar', avg: 76 }, { month: 'Apr', avg: 82 }, { month: 'May', avg: 79 },
];

const classComp = [
  { cls: 'Grade 10A', avg: 78, quizzes: 45 }, { cls: 'Grade 10B', avg: 72, quizzes: 42 },
  { cls: 'Grade 11A', avg: 82, quizzes: 38 }, { cls: 'Grade 11B', avg: 68, quizzes: 40 },
];

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function Performance() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Performance Analytics</h1>
        <p className="text-slate-400 text-sm">Comprehensive performance tracking across all classes</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Avg" value="78%" icon={BarChart3} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: '+4.2% this term', positive: true }} delay={0.1} />
        <StatCard title="Pass Rate" value="89%" icon={TrendingUp} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="Above 60% threshold" delay={0.15} />
        <StatCard title="Total Quizzes" value="165" icon={BarChart3} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="Across all classes" delay={0.2} />
        <StatCard title="Avg Improvement" value="+14%" icon={TrendingUp} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" subtitle="Since start of term" delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Monthly Performance" subtitle="Average scores over the academic year" delay={0.3}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyPerf}>
              <defs><linearGradient id="pmGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#pmGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Class Comparison" subtitle="Average performance per class" delay={0.35}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classComp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="cls" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="avg" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} name="Average %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
