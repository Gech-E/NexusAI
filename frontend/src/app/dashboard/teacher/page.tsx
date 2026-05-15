'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertTriangle, Activity, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const performanceData = [
  { week: 'W1', avg: 72, best: 95, worst: 45 },
  { week: 'W2', avg: 75, best: 92, worst: 50 },
  { week: 'W3', avg: 71, best: 88, worst: 42 },
  { week: 'W4', avg: 79, best: 98, worst: 55 },
  { week: 'W5', avg: 82, best: 96, worst: 60 },
  { week: 'W6', avg: 78, best: 94, worst: 52 },
];

const riskDistribution = [
  { name: 'On Track', value: 64, color: '#10b981' },
  { name: 'At Risk', value: 22, color: '#f59e0b' },
  { name: 'Struggling', value: 14, color: '#ef4444' },
];

interface CVAlert {
  student_id: string;
  alert_type: string;
  confidence: number;
  timestamp_ms: number;
}

interface TeacherStats {
  active_students: number;
  avg_class_performance: number;
  active_alerts: number;
  upcoming_exams: number;
  student_trend: string;
}

export default function TeacherDashboard() {
  const user = useAppStore(state => state.user);
  const accessToken = useAppStore(state => state.accessToken);
  const router = useRouter();

  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<CVAlert[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/analytics/teacher/summary', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch teacher stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [accessToken]);

  useEffect(() => {
    if (!user) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/cv-alerts/${user.id}`);
    ws.onopen = () => {
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 10000);
      wsRef.current = ws;
      return () => clearInterval(pingInterval);
    };
    ws.onmessage = (event) => {
      try {
        const newAlert: CVAlert = JSON.parse(event.data);
        setAlerts(prev => [newAlert, ...prev].slice(0, 10));
      } catch { /* ignore non-JSON */ }
    };
    return () => ws.close();
  }, [user]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor((Date.now() - ms) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome + Alerts Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glassmorphism p-8 rounded-3xl flex-1 bg-gradient-to-br from-emerald-900/30 to-slate-900/30 border-emerald-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs text-emerald-300 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Classroom AI Active
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Classroom Insights</h1>
            <p className="text-slate-400 mb-6 max-w-lg">
              {stats?.active_students || 0} active students today. {stats?.active_alerts || 0} live alerts detected.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push('/dashboard/teacher/exams/create')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3 rounded-full transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Create Exam
              </button>
              <button
                onClick={() => router.push('/dashboard/teacher/students')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-full flex items-center gap-2 transition-colors border border-slate-700"
              >
                <Users className="w-4 h-4" /> View Students
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live CV Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glassmorphism p-6 rounded-3xl w-full lg:w-[350px] flex flex-col h-[300px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-white">Live CV Alerts</h3>
            <span className="ml-auto flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, idx) => (
                <motion.div
                  key={`${alert.timestamp_ms}-${idx}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="p-3 bg-slate-800/50 rounded-xl border border-slate-700"
                >
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">{alert.student_id}</span> - {alert.alert_type.replace('_', ' ')}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-amber-500">{formatTime(alert.timestamp_ms)}</p>
                    <p className="text-xs text-slate-500">Conf: {Math.round(alert.confidence * 100)}%</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {alerts.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-8">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Waiting for live data...
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.active_students || 0}
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20"
          subtitle="Active in school"
          delay={0.1}
        />
        <StatCard
          title="Avg. Performance"
          value={`${stats?.avg_class_performance || 0}%`}
          icon={Activity}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          trend={{ value: `${stats?.student_trend || '+0%'} from last month`, positive: true }}
          delay={0.15}
        />
        <StatCard
          title="Upcoming Exams"
          value={stats?.upcoming_exams || 0}
          icon={FileText}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/10 border-purple-500/20"
          subtitle="Scheduled this week"
          delay={0.2}
        />
        <StatCard
          title="AI Alerts"
          value={stats?.active_alerts || 0}
          icon={AlertTriangle}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          subtitle="Active monitoring"
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Class Performance Trend" subtitle="Weekly average scores" delay={0.3} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="avg" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#avgGrad)" name="Average" />
              <Area type="monotone" dataKey="best" stroke="#06b6d4" strokeWidth={1} fillOpacity={0} strokeDasharray="4 4" name="Best" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Student Risk Analysis" subtitle="AI-powered prediction" delay={0.35}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                iconType="circle"
                iconSize={8}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
