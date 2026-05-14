'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, Loader2, BrainCircuit } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, BarChart, Bar
} from 'recharts';

const perfHistory = [
  { date: 'W1', score: 62 }, { date: 'W2', score: 68 }, { date: 'W3', score: 65 },
  { date: 'W4', score: 74 }, { date: 'W5', score: 78 }, { date: 'W6', score: 72 },
  { date: 'W7', score: 82 }, { date: 'W8', score: 85 },
];

const skillRadar = [
  { skill: 'Algebra', current: 82, target: 90 }, { skill: 'Geometry', current: 68, target: 85 },
  { skill: 'Calculus', current: 74, target: 80 }, { skill: 'Statistics', current: 90, target: 85 },
  { skill: 'Physics', current: 65, target: 75 }, { skill: 'Chemistry', current: 78, target: 80 },
];

const studyTime = [
  { day: 'Mon', hours: 2.5 }, { day: 'Tue', hours: 3.2 }, { day: 'Wed', hours: 1.8 },
  { day: 'Thu', hours: 4.1 }, { day: 'Fri', hours: 2.9 }, { day: 'Sat', hours: 5.0 }, { day: 'Sun', hours: 1.5 },
];

const topics = [
  { topic: 'Linear Equations', score: 92 }, { topic: 'Quadratic Functions', score: 78 },
  { topic: 'Trigonometry', score: 65 }, { topic: 'Derivatives', score: 71 },
  { topic: 'Integrals', score: 58 }, { topic: 'Probability', score: 88 },
];

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function StudentAnalytics() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Learning Analytics</h1>
        <p className="text-slate-400 text-sm">AI-powered insights into your learning journey</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Score" value="79%" icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: '+12% vs last month', positive: true }} delay={0.1} />
        <StatCard title="Quizzes Taken" value="43" icon={Target} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="8 this week" delay={0.15} />
        <StatCard title="Study Hours" value="21 hrs" icon={Clock} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="This week" delay={0.2} />
        <StatCard title="Streak" value="7 days" icon={Zap} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" trend={{ value: 'Personal best!', positive: true }} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Performance Trend" subtitle="Weekly average scores" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={perfHistory}>
              <defs><linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#perfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Skill Map" subtitle="Current vs target proficiency" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={skillRadar} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="skill" stroke="#64748b" fontSize={11} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" fontSize={10} />
              <Radar name="Current" dataKey="current" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Target" dataKey="target" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
              <Tooltip contentStyle={ttStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Study Time" subtitle="Hours spent per day" delay={0.4}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={studyTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="hours" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Topic Breakdown" subtitle="Scores by subject topic" delay={0.45}>
          <div className="space-y-4">
            {topics.map((t, i) => (
              <div key={t.topic}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-slate-300">{t.topic}</span>
                  <span className="text-xs text-slate-500">{t.score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }}
                    className={`h-full rounded-full ${t.score >= 80 ? 'bg-emerald-500' : t.score >= 60 ? 'bg-cyan-500' : 'bg-amber-500'}`} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glassmorphism p-6 rounded-2xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-cyan-400" /> AI Learning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-slate-400 mb-1">Predicted Final Score</p>
            <p className="text-lg font-bold text-emerald-400">84%</p>
            <p className="text-xs text-slate-500 mt-1">Based on current trajectory</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-slate-400 mb-1">Weakest Area</p>
            <p className="text-lg font-bold text-amber-400">Integrals</p>
            <p className="text-xs text-slate-500 mt-1">Recommended: 2 more practice sessions</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-xs text-slate-400 mb-1">Optimal Study Time</p>
            <p className="text-lg font-bold text-cyan-400">10 AM - 1 PM</p>
            <p className="text-xs text-slate-500 mt-1">Highest retention period detected</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
