'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

interface WeakTopic {
  topic: string;
  avgScore: number;
  students: number;
  trend: number;
  subject: string;
}

export default function WeakTopics() {
  const accessToken = useAppStore(state => state.accessToken);
  const [topics, setTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/teacher/weak-topics', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setTopics(await res.json());
      } catch (error) {
        console.error('Failed to fetch weak topics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

  const chartData = topics.map(t => ({ topic: t.topic.length > 12 ? t.topic.slice(0, 12) + '…' : t.topic, score: t.avgScore }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Weak Topic Detection</h1>
        <p className="text-slate-400 text-sm">AI-identified areas where students need the most help</p>
      </motion.div>

      {chartData.length > 0 && (
        <ChartCard title="Topic Score Overview" subtitle="Lowest scoring topics across all quizzes" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="topic" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={ttStyle} />
              <Bar dataKey="score" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={28} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {topics.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No weak topics detected</p>
          <p className="text-sm">Students need to complete quizzes with topic tags for analysis.</p>
        </div>
      )}

      <div className="space-y-4">
        {topics.map((topic, idx) => (
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
