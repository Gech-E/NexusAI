'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MonitorSmartphone, BrainCircuit, Zap, Clock, Activity, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const latencyData = [
  { time: '00:00', tutor: 120, recommend: 85, cv: 45 },
  { time: '04:00', tutor: 95, recommend: 72, cv: 38 },
  { time: '08:00', tutor: 180, recommend: 110, cv: 62 },
  { time: '12:00', tutor: 220, recommend: 140, cv: 78 },
  { time: '16:00', tutor: 250, recommend: 160, cv: 88 },
  { time: '20:00', tutor: 150, recommend: 95, cv: 52 },
];

const iconMap: Record<string, React.ElementType> = {
  'AI Tutor (Gemini)': BrainCircuit,
  'Recommendation Engine': Zap,
  'CV Monitor (Vision)': MonitorSmartphone,
  'Embedding Generator': Activity,
};

const colorMap: Record<string, string> = {
  'AI Tutor (Gemini)': 'cyan',
  'Recommendation Engine': 'emerald',
  'CV Monitor (Vision)': 'purple',
  'Embedding Generator': 'amber',
};

const tt = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

interface AIModel {
  name: string;
  version: string;
  status: string;
  queries: string;
  avg_latency: string;
}

interface AIStats {
  total_queries: number;
  user_queries: number;
  ai_responses: number;
  total_conversations: number;
  total_recommendations: number;
  unique_ai_users: number;
  models: AIModel[];
  gemini_configured: boolean;
}

export default function AIMonitor() {
  const accessToken = useAppStore(state => state.accessToken);
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(apiUrl('/api/v1/ai/stats'), {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error('Failed to fetch AI stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, [accessToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const models = stats?.models || [];
  const totalQueries = stats?.total_queries || 0;
  const activeModels = models.filter(m => m.status === 'running').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">AI Engine Monitor</h1>
          <p className="text-slate-400 text-sm">Real-time monitoring of all AI subsystems</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            stats?.gemini_configured
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
          }`}>
            {stats?.gemini_configured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {stats?.gemini_configured ? 'Gemini Connected' : 'Fallback Mode'}
          </span>
          <button onClick={handleRefresh} disabled={refreshing}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total AI Queries" value={totalQueries.toLocaleString()} icon={BrainCircuit}
          iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="All time" delay={0.1} />
        <StatCard title="Conversations" value={stats?.total_conversations?.toLocaleString() || '0'} icon={Clock}
          iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20"
          subtitle={`${stats?.unique_ai_users || 0} unique users`} delay={0.15} />
        <StatCard title="Models Active" value={`${activeModels} / ${models.length}`} icon={Zap}
          iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20"
          subtitle={`${models.length - activeModels} on standby`} delay={0.2} />
        <StatCard title="Recommendations" value={stats?.total_recommendations?.toLocaleString() || '0'} icon={Activity}
          iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20"
          subtitle="Generated total" delay={0.25} />
      </div>

      <ChartCard title="Model Latency Over Time" subtitle="Response time in milliseconds" delay={0.3}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
            <Tooltip contentStyle={tt} />
            <Line type="monotone" dataKey="tutor" stroke="#06b6d4" strokeWidth={2} dot={false} name="AI Tutor" />
            <Line type="monotone" dataKey="recommend" stroke="#10b981" strokeWidth={2} dot={false} name="Recommender" />
            <Line type="monotone" dataKey="cv" stroke="#8b5cf6" strokeWidth={2} dot={false} name="CV Monitor" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((m, idx) => {
          const Icon = iconMap[m.name] || BrainCircuit;
          const color = colorMap[m.name] || 'cyan';
          return (
            <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.06 }} className="glassmorphism p-5 rounded-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${color}-500/10 border border-${color}-500/20 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{m.name}</h3>
                    <p className="text-xs text-slate-500">{m.version}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 text-xs ${
                  m.status === 'running' ? 'text-emerald-400' : m.status === 'fallback' ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    m.status === 'running' ? 'bg-emerald-500 animate-pulse' : m.status === 'fallback' ? 'bg-amber-500' : 'bg-slate-600'
                  }`} />
                  {m.status}
                </span>
              </div>
              <div className="flex gap-6 text-sm">
                <div><p className="text-slate-500 text-xs">Queries</p><p className="text-white font-semibold">{m.queries}</p></div>
                <div><p className="text-slate-500 text-xs">Avg Latency</p><p className="text-white font-semibold">{m.avg_latency}</p></div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
