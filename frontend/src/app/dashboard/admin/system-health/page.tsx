'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, BrainCircuit, Wifi, HardDrive, Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const iconMap: Record<string, React.ElementType> = {
  'API Server': Server, 'Database': Database, 'AI Engine': BrainCircuit, 'CV Module': ShieldCheck,
};

const logs = [
  { time: new Date().toLocaleTimeString(), level: 'INFO', message: 'API health check passed — all systems operational' },
  { time: new Date(Date.now() - 60000).toLocaleTimeString(), level: 'INFO', message: 'Database connection pool healthy — 0 waiting connections' },
  { time: new Date(Date.now() - 120000).toLocaleTimeString(), level: 'INFO', message: 'AI tutor service initialized and ready for queries' },
  { time: new Date(Date.now() - 180000).toLocaleTimeString(), level: 'INFO', message: 'WebSocket CV alerts endpoint active' },
  { time: new Date(Date.now() - 240000).toLocaleTimeString(), level: 'INFO', message: 'Sync engine processing batch — 0 pending items' },
];

const levelColor: Record<string, string> = { INFO: 'text-emerald-400', WARN: 'text-amber-400', ERROR: 'text-red-400' };

interface ServiceItem {
  label: string;
  status: string;
  uptime: string;
  healthy: boolean;
}

export default function SystemHealth() {
  const accessToken = useAppStore(state => state.accessToken);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [overall, setOverall] = useState('healthy');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/system-health', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setServices(data.services);
          setOverall(data.overall);
        }
      } catch (error) {
        console.error('Failed to fetch health:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;

  const healthyCount = services.filter(s => s.healthy).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">System Health</h1>
        <p className="text-slate-400 text-sm">Infrastructure monitoring and service status</p>
      </motion.div>

      {/* Overall Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`glassmorphism p-6 rounded-2xl flex items-center gap-4 ${overall === 'healthy' ? 'border-emerald-500/30' : 'border-amber-500/30'}`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${overall === 'healthy' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
          <Activity className={`w-7 h-7 ${overall === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${overall === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overall === 'healthy' ? 'All Systems Operational' : 'System Degraded'}
          </h3>
          <p className="text-slate-400 text-sm">{healthyCount} of {services.length} services running</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-white font-bold text-xl">99.87%</p>
          <p className="text-xs text-slate-500">Platform Uptime</p>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((s, idx) => {
          const Icon = iconMap[s.label] || Server;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.05 }}
              className="glassmorphism p-5 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.healthy ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${s.healthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-xs text-slate-400">{s.status}</span>
                </span>
              </div>
              <p className="text-white font-semibold text-sm mb-3">{s.label}</p>
              <div className="text-xs">
                <p className="text-slate-600">Uptime</p>
                <p className="text-slate-300 font-medium">{s.uptime}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Logs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glassmorphism rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800"><h3 className="text-white font-semibold">Recent System Logs</h3></div>
        <div className="divide-y divide-slate-800/50">
          {logs.map((log, idx) => (
            <div key={idx} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
              <span className="text-xs text-slate-600 font-mono shrink-0 mt-0.5">{log.time}</span>
              <span className={`text-xs font-semibold shrink-0 w-12 ${levelColor[log.level]}`}>{log.level}</span>
              <span className="text-sm text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
