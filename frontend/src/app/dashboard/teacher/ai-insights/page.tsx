'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Users, Loader2, Info, CheckCircle2, RefreshCw, ArrowUpRight, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

const iconMap: Record<string, React.ElementType> = {
  warning: AlertTriangle,
  alert: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};
const colorStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' },
  alert: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' },
  info: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', icon: 'text-cyan-400' },
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
};

interface Insight { type: string; title: string; description: string; }
interface NarrativeData {
  narrative_summary: string;
  insights: Insight[];
  action_items: string[];
  predicted_trend: string;
  confidence: number;
  data: {
    total_students: number;
    avg_score: number;
    pass_rate: number;
    at_risk_count: number;
    total_quizzes: number;
    total_courses: number;
  };
}

export default function AIInsights() {
  const accessToken = useAppStore(state => state.accessToken);
  const [data, setData] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(apiUrl('/api/v1/ai/teacher/narrative'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchInsights(); }, [accessToken]);

  const handleRefresh = () => { setRefreshing(true); fetchInsights(); };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

  const trendIcon = data?.predicted_trend === 'improving' ? TrendingUp : data?.predicted_trend === 'declining' ? TrendingDown : Minus;
  const trendColor = data?.predicted_trend === 'improving' ? 'text-emerald-400' : data?.predicted_trend === 'declining' ? 'text-red-400' : 'text-amber-400';
  const TrendIcon = trendIcon;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-emerald-400" /> AI Insights
          </h1>
          <p className="text-slate-400 text-sm">AI-powered analysis of your classroom data</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Regenerate
        </button>
      </motion.div>

      {/* AI Narrative Summary */}
      {data?.narrative_summary && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glassmorphism p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-white font-medium text-sm mb-1">AI Summary</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{data.narrative_summary}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className={`flex items-center gap-1 text-xs ${trendColor}`}>
                  <TrendIcon className="w-3.5 h-3.5" /> Trend: {data.predicted_trend}
                </span>
                <span className="text-xs text-slate-500">
                  Confidence: {Math.round((data.confidence || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      {data?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: data.data.total_students, icon: Users, color: 'blue' },
            { label: 'Avg Score', value: `${data.data.avg_score}%`, icon: TrendingUp, color: data.data.avg_score >= 60 ? 'emerald' : 'amber' },
            { label: 'Pass Rate', value: `${data.data.pass_rate}%`, icon: CheckCircle2, color: data.data.pass_rate >= 70 ? 'emerald' : 'amber' },
            { label: 'At Risk', value: data.data.at_risk_count, icon: AlertTriangle, color: data.data.at_risk_count > 0 ? 'red' : 'emerald' },
          ].map((card, idx) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }} className="glassmorphism p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                <span className="text-xs text-slate-500">{card.label}</span>
              </div>
              <p className={`text-2xl font-bold text-${card.color}-400`}>{card.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Insights Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <h3 className="text-white font-semibold mb-4">AI-Generated Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data?.insights || []).map((insight, idx) => {
            const Icon = iconMap[insight.type] || Lightbulb;
            const styles = colorStyles[insight.type] || colorStyles.info;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.06 }}
                className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 ${styles.bg} border ${styles.border} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${styles.icon}`} />
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

      {/* Action Items */}
      {data?.action_items && data.action_items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glassmorphism p-6 rounded-2xl">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" /> Recommended Actions
          </h3>
          <div className="space-y-3">
            {data.action_items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 group">
                <div className="w-6 h-6 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-slate-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
