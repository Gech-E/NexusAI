'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, Users, Target, BookOpen } from 'lucide-react';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const topicPerformance = [
  { topic: 'Algebra', avg: 78 }, { topic: 'Geometry', avg: 62 },
  { topic: 'Calculus', avg: 55 }, { topic: 'Statistics', avg: 82 },
  { topic: 'Trig', avg: 48 }, { topic: 'Physics', avg: 71 },
];

const insights = [
  { icon: AlertTriangle, color: 'amber', title: 'Struggling Group Detected', desc: '7 students scored below 50% on Trigonometry. Consider a review session.' },
  { icon: TrendingUp, color: 'emerald', title: 'Positive Trend', desc: 'Class average improved 8.2% over the last 3 weeks in Algebra.' },
  { icon: Lightbulb, color: 'cyan', title: 'Recommended Action', desc: 'Assign practice problems on Calculus derivatives — 60% of students show gaps.' },
  { icon: Users, color: 'purple', title: 'Peer Learning Opportunity', desc: 'Pair top performers (Amara, Grace) with at-risk students for study groups.' },
  { icon: Target, color: 'blue', title: 'Exam Prediction', desc: 'AI predicts 72% class pass rate for upcoming mid-term. Focus on weak areas.' },
  { icon: BookOpen, color: 'pink', title: 'Content Gap', desc: 'No exercises available for "Integration by Parts" — create new quiz questions.' },
];

const ttStyle = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function AIInsights() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-emerald-400" /> AI Insights
        </h1>
        <p className="text-slate-400 text-sm">Machine learning-powered analysis of your classroom data</p>
      </motion.div>

      <ChartCard title="Topic Performance Heatmap" subtitle="Average scores across topics" delay={0.1}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topicPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="topic" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={ttStyle} />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]} barSize={36}>
              {topicPerformance.map((entry, idx) => (
                <motion.rect key={idx} fill={entry.avg >= 70 ? '#10b981' : entry.avg >= 50 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-white font-semibold mb-4">AI-Generated Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + idx * 0.06 }}
              className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 bg-${insight.color}-500/10 border border-${insight.color}-500/20 rounded-xl flex items-center justify-center shrink-0`}>
                  <insight.icon className={`w-5 h-5 text-${insight.color}-400`} />
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
