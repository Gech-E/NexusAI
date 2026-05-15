'use client';

import { motion } from 'framer-motion';
import { MonitorSmartphone, BrainCircuit, Zap, Clock, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const latencyData = [
  { time: '00:00', tutor: 120, recommend: 85, cv: 45 },
  { time: '04:00', tutor: 95, recommend: 72, cv: 38 },
  { time: '08:00', tutor: 180, recommend: 110, cv: 62 },
  { time: '12:00', tutor: 220, recommend: 140, cv: 78 },
  { time: '16:00', tutor: 250, recommend: 160, cv: 88 },
  { time: '20:00', tutor: 150, recommend: 95, cv: 52 },
];

const models = [
  { name: 'AI Tutor (LLM)', version: 'v2.1.4', status: 'running', queries: '4,291', avgLatency: '180ms', icon: BrainCircuit, color: 'cyan' },
  { name: 'Recommendation Engine', version: 'v1.8.2', status: 'running', queries: '1,204', avgLatency: '95ms', icon: Zap, color: 'emerald' },
  { name: 'CV Monitor (Vision)', version: 'v1.3.0', status: 'standby', queries: '342', avgLatency: '52ms', icon: MonitorSmartphone, color: 'purple' },
  { name: 'Embedding Generator', version: 'v1.1.1', status: 'running', queries: '892', avgLatency: '65ms', icon: Activity, color: 'amber' },
];

const tt = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function AIMonitor() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">AI Engine Monitor</h1>
        <p className="text-slate-400 text-sm">Real-time monitoring of all AI subsystems</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total AI Queries" value="6,729" icon={BrainCircuit} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" subtitle="Today" delay={0.1} />
        <StatCard title="Avg Latency" value="128ms" icon={Clock} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: '-12ms vs yesterday', positive: true }} delay={0.15} />
        <StatCard title="Models Active" value="3 / 4" icon={Zap} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="1 on standby" delay={0.2} />
        <StatCard title="Error Rate" value="0.02%" icon={Activity} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" trend={{ value: 'Below threshold', positive: true }} delay={0.25} />
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
        {models.map((m, idx) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + idx * 0.06 }}
            className="glassmorphism p-5 rounded-2xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-${m.color}-500/10 border border-${m.color}-500/20 rounded-xl flex items-center justify-center`}>
                  <m.icon className={`w-5 h-5 text-${m.color}-400`} />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{m.name}</h3>
                  <p className="text-xs text-slate-500">{m.version}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1.5 text-xs ${m.status === 'running' ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`h-2 w-2 rounded-full ${m.status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {m.status}
              </span>
            </div>
            <div className="flex gap-6 text-sm">
              <div><p className="text-slate-500 text-xs">Queries</p><p className="text-white font-semibold">{m.queries}</p></div>
              <div><p className="text-slate-500 text-xs">Avg Latency</p><p className="text-white font-semibold">{m.avgLatency}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
