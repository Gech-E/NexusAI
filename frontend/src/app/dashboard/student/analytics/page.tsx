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
  PolarRadiusAxis
} from 'recharts';

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

interface DetailedData {
  weekly_performance: { day: string; score: number }[];
  subject_mastery: { subject: string; mastery: number }[];
  total_completed: number;
  average_score: number;
  best_score: number;
  learning_streak_days: number;
  recent_results: { quiz_title: string; score: number; date: string | null }[];
}

export default function StudentAnalytics() {
  const accessToken = useAppStore(state => state.accessToken);
  const [data, setData] = useState<DetailedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailed = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/me/detailed', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetailed();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  const radarData = (data?.subject_mastery || []).map(s => ({ skill: s.subject, current: s.mastery, target: 85 }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Learning Analytics</h1>
        <p className="text-slate-400 text-sm">AI-powered insights into your learning journey</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Overall Score" value={`${data?.average_score || 0}%`} icon={TrendingUp} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: `Best: ${data?.best_score || 0}%`, positive: true }} delay={0.1} />
        <StatCard title="Quizzes Taken" value={data?.total_completed || 0} icon={Target} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="Completed" delay={0.15} />
        <StatCard title="Study Hours" value="—" icon={Clock} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="Track via AI Tutor" delay={0.2} />
        <StatCard title="Streak" value={`${data?.learning_streak_days || 0} days`} icon={Zap} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" trend={{ value: data?.learning_streak_days && data.learning_streak_days >= 7 ? 'Personal best!' : 'Keep going!', positive: true }} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Performance Trend" subtitle="Recent quiz scores" delay={0.3}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data?.weekly_performance || []}>
              <defs><linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#perfGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {radarData.length > 0 && (
          <ChartCard title="Skill Map" subtitle="Current vs target proficiency" delay={0.35}>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="skill" stroke="#64748b" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" fontSize={10} />
                <Radar name="Current" dataKey="current" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Target" dataKey="target" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                <Tooltip contentStyle={ttStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Recent Results */}
      {data?.recent_results && data.recent_results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glassmorphism rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800"><h3 className="text-white font-semibold">Recent Quiz Results</h3></div>
          <div className="divide-y divide-slate-800/50">
            {data.recent_results.map((r, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{r.quiz_title}</p>
                  <p className="text-xs text-slate-500">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</p>
                </div>
                <span className={`text-sm font-bold ${r.score >= 80 ? 'text-emerald-400' : r.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{r.score}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glassmorphism p-6 rounded-2xl">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-cyan-400" /> AI Learning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-slate-400 mb-1">Predicted Final Score</p>
            <p className="text-lg font-bold text-emerald-400">{data ? Math.min(100, Math.round(data.average_score * 1.05)) : 0}%</p>
            <p className="text-xs text-slate-500 mt-1">Based on current trajectory</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-xs text-slate-400 mb-1">Weakest Area</p>
            <p className="text-lg font-bold text-amber-400">{data?.subject_mastery?.length ? data.subject_mastery.reduce((a, b) => a.mastery < b.mastery ? a : b).subject : 'N/A'}</p>
            <p className="text-xs text-slate-500 mt-1">Focus more practice here</p>
          </div>
          <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-xs text-slate-400 mb-1">Learning Streak</p>
            <p className="text-lg font-bold text-cyan-400">{data?.learning_streak_days || 0} days</p>
            <p className="text-xs text-slate-500 mt-1">{data?.learning_streak_days && data.learning_streak_days >= 7 ? 'Amazing consistency!' : 'Keep studying daily!'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
