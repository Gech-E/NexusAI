'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Building2, Activity, DollarSign, BrainCircuit, Server,
  TrendingUp, ShieldCheck, Loader2, Globe, Zap, AlertTriangle
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 12400, users: 340 },
  { month: 'Feb', revenue: 15800, users: 420 },
  { month: 'Mar', revenue: 18200, users: 510 },
  { month: 'Apr', revenue: 22100, users: 680 },
  { month: 'May', revenue: 28500, users: 890 },
  { month: 'Jun', revenue: 32800, users: 1120 },
];

const userGrowthData = [
  { month: 'Jan', students: 280, teachers: 45, admins: 15 },
  { month: 'Feb', students: 350, teachers: 52, admins: 18 },
  { month: 'Mar', students: 420, teachers: 68, admins: 22 },
  { month: 'Apr', students: 580, teachers: 74, admins: 26 },
  { month: 'May', students: 740, teachers: 95, admins: 30 },
  { month: 'Jun', students: 920, teachers: 128, admins: 35 },
];

const regionData = [
  { name: 'East Africa', value: 42, color: '#06b6d4' },
  { name: 'West Africa', value: 28, color: '#10b981' },
  { name: 'South Asia', value: 18, color: '#8b5cf6' },
  { name: 'Other', value: 12, color: '#f59e0b' },
];

const aiMetrics = [
  { hour: '00', queries: 12, latency: 120 },
  { hour: '04', queries: 8, latency: 95 },
  { hour: '08', queries: 45, latency: 180 },
  { hour: '12', queries: 78, latency: 210 },
  { hour: '16', queries: 92, latency: 240 },
  { hour: '20', queries: 56, latency: 150 },
];

export default function AdminDashboard() {
  const user = useAppStore(state => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphism p-8 rounded-3xl bg-gradient-to-br from-purple-900/30 to-slate-900/30 border-purple-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-purple-300 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            Platform Administrator
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Platform Command Center</h1>
          <p className="text-slate-400 max-w-xl">
            Global analytics across all institutions. AI systems operating at 99.8% uptime. 1,083 active users across 12 institutions.
          </p>
        </div>
      </motion.div>

      {/* Top-level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value="1,083"
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20"
          trend={{ value: '+18.2% this month', positive: true }}
          delay={0.1}
        />
        <StatCard
          title="Institutions"
          value="12"
          icon={Building2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          trend={{ value: '+2 this quarter', positive: true }}
          delay={0.15}
        />
        <StatCard
          title="AI Queries Today"
          value="4,291"
          icon={BrainCircuit}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10 border-cyan-500/20"
          subtitle="Avg latency: 180ms"
          delay={0.2}
        />
        <StatCard
          title="Monthly Revenue"
          value="$32.8K"
          icon={DollarSign}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10 border-amber-500/20"
          trend={{ value: '+15.5% vs last month', positive: true }}
          delay={0.25}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Revenue Growth" subtitle="Monthly recurring revenue trend" delay={0.3} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Region Distribution" subtitle="Users by geographical region" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={regionData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {regionData.map((entry, index) => (
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
                formatter={(value: number) => [`${value}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Growth" subtitle="Monthly registrations by role" delay={0.4}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Bar dataKey="students" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Students" />
              <Bar dataKey="teachers" fill="#10b981" radius={[4, 4, 0, 0]} name="Teachers" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI Engine Performance" subtitle="Query volume & response latency" delay={0.45}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={aiMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}:00`} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="queries" stroke="#06b6d4" strokeWidth={2} dot={false} name="Queries" />
              <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Latency (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* System Health Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-white font-semibold mb-4">System Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'API Server', status: 'Healthy', uptime: '99.98%', icon: Server, color: 'emerald' },
            { label: 'AI Engine', status: 'Running', uptime: '99.8%', icon: BrainCircuit, color: 'cyan' },
            { label: 'Database', status: 'Connected', uptime: '99.99%', icon: Activity, color: 'blue' },
            { label: 'CV Module', status: 'Standby', uptime: '97.2%', icon: ShieldCheck, color: 'purple' },
          ].map((service) => (
            <div key={service.label} className="glassmorphism p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <service.icon className={`w-5 h-5 text-${service.color}-400`} />
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full bg-${service.color}-500 animate-pulse`} />
                  <span className="text-xs text-slate-400">{service.status}</span>
                </span>
              </div>
              <p className="text-white font-semibold text-sm">{service.label}</p>
              <p className="text-slate-500 text-xs mt-1">Uptime: {service.uptime}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
