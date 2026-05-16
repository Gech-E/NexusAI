'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, Users, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const iconMap: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  alert: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};
const colorMap: Record<string, string> = {
  warning: 'amber',
  alert: 'red',
  info: 'cyan',
  success: 'emerald',
};

interface Insight {
  type: string;
  title: string;
  description: string;
}

interface InsightsData {
  insights: Insight[];
  summary: {
    total_students: number;
    avg_performance: number;
    at_risk_count: number;
  };
}

export default function AIInsights() {
  const accessToken = useAppStore(state => state.accessToken);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/analytics/teacher/ai-insights', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setData(await res.json());
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-emerald-400" /> AI Insights
        </h1>
        <p className="text-slate-400 text-sm">Machine learning-powered analysis of your classroom data</p>
      </motion.div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glassmorphism p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-slate-500">Total Students</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.summary.total_students}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glassmorphism p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-slate-500">Avg Performance</span>
            </div>
            <p className={`text-2xl font-bold ${data.summary.avg_performance >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>{data.summary.avg_performance}%</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glassmorphism p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-xs text-slate-500">At Risk Students</span>
            </div>
            <p className={`text-2xl font-bold ${data.summary.at_risk_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{data.summary.at_risk_count}</p>
          </motion.div>
        </div>
      )}

      {/* Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h3 className="text-white font-semibold mb-4">AI-Generated Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.insights || []).map((insight, idx) => {
            const Icon = iconMap[insight.type] || Lightbulb;
            const color = colorMap[insight.type] || 'cyan';
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.06 }}
                className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-${color}-500/10 border border-${color}-500/20 rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1">{insight.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
