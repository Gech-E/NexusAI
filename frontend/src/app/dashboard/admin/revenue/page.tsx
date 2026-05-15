'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const revenueData = [
  { month: 'Jul', revenue: 8200 }, { month: 'Aug', revenue: 9800 }, { month: 'Sep', revenue: 12400 },
  { month: 'Oct', revenue: 15800 }, { month: 'Nov', revenue: 18200 }, { month: 'Dec', revenue: 22100 },
  { month: 'Jan', revenue: 24500 }, { month: 'Feb', revenue: 28500 }, { month: 'Mar', revenue: 30200 },
  { month: 'Apr', revenue: 31800 }, { month: 'May', revenue: 32800 },
];

const planBreakdown = [
  { plan: 'Free', users: 620 }, { plan: 'Basic', users: 280 },
  { plan: 'Pro', users: 145 }, { plan: 'Enterprise', users: 38 },
];

const tt = { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f8fafc', fontSize: '12px' };

export default function Revenue() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Revenue & Billing</h1>
        <p className="text-slate-400 text-sm">Financial overview and subscription metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value="$32.8K" icon={DollarSign} iconColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" trend={{ value: '+15.5% vs last month', positive: true }} delay={0.1} />
        <StatCard title="ARR" value="$393.6K" icon={TrendingUp} iconColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" trend={{ value: '+42% YoY', positive: true }} delay={0.15} />
        <StatCard title="Paying Users" value="463" icon={Users} iconColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" subtitle="42.7% conversion rate" delay={0.2} />
        <StatCard title="Avg Revenue/User" value="$70.84" icon={CreditCard} iconColor="text-amber-400" iconBg="bg-amber-500/10 border-amber-500/20" trend={{ value: '+$8.20 vs Q1', positive: true }} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Revenue Growth" subtitle="Monthly recurring revenue" delay={0.3} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs><linearGradient id="rvGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={tt} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#rvGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Plan Distribution" subtitle="Users by subscription tier" delay={0.35}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={planBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="plan" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
              <Tooltip contentStyle={tt} />
              <Bar dataKey="users" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
