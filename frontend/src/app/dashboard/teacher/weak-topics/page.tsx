'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Users, BookOpen, Target } from 'lucide-react';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const weakTopics = [
  { topic: 'Trigonometric Identities', avgScore: 42, students: 18, trend: -8, subject: 'Mathematics' },
  { topic: 'Integration by Parts', avgScore: 48, students: 15, trend: -5, subject: 'Calculus' },
  { topic: 'Organic Reactions', avgScore: 51, students: 12, trend: -3, subject: 'Chemistry' },
  { topic: 'Newton\'s Third Law', avgScore: 55, students: 10, trend: +2, subject: 'Physics' },
  { topic: 'Conditional Probability', avgScore: 58, students: 8, trend: -1, subject: 'Statistics' },
];

const compData = [
  { topic: 'Trig ID', before: 38, after: 42 }, { topic: 'Integration', before: 45, after: 48 },
  { topic: 'Org. Chem', before: 49, after: 51 }, { topic: 'Newton 3', before: 50, after: 55 },
  { topic: 'Cond. Prob', before: 56, after: 58 },
];

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function WeakTopics() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Weak Topic Detection</h1>
        <p className="text-slate-400 text-sm">AI-identified areas where students need the most help</p>
      </motion.div>

      <ChartCard title="Before vs After Intervention" subtitle="Score comparison after targeted review sessions" delay={0.1}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={compData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="topic" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="before" fill="#64748b" radius={[4, 4, 0, 0]} barSize={20} name="Before" />
            <Bar dataKey="after" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} name="After" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="space-y-4">
        {weakTopics.map((topic, idx) => (
          <motion.div key={topic.topic} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.06 }}
            className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${topic.avgScore < 50 ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <AlertTriangle className={`w-6 h-6 ${topic.avgScore < 50 ? 'text-red-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{topic.topic}</h3>
                  <p className="text-slate-500 text-xs">{topic.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className={`font-bold ${topic.avgScore < 50 ? 'text-red-400' : 'text-amber-400'}`}>{topic.avgScore}%</p>
                  <p className="text-[10px] text-slate-600">Avg Score</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-300">{topic.students}</p>
                  <p className="text-[10px] text-slate-600">Students</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold flex items-center gap-1 ${topic.trend < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    <TrendingDown className={`w-3 h-3 ${topic.trend >= 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(topic.trend)}%
                  </p>
                  <p className="text-[10px] text-slate-600">Trend</p>
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 transition-colors">
                  Create Review
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
