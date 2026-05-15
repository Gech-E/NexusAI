'use client';

import { motion } from 'framer-motion';
import { Server, Database, BrainCircuit, Wifi, HardDrive, Cpu, Activity, ShieldCheck } from 'lucide-react';

const services = [
  { name: 'API Server (FastAPI)', status: 'healthy', uptime: '99.98%', cpu: '12%', mem: '340 MB', icon: Server, color: 'emerald' },
  { name: 'SQLite Database', status: 'connected', uptime: '99.99%', cpu: '3%', mem: '128 MB', icon: Database, color: 'blue' },
  { name: 'AI Inference Engine', status: 'running', uptime: '99.80%', cpu: '45%', mem: '1.2 GB', icon: BrainCircuit, color: 'cyan' },
  { name: 'CV Monitor (C++)', status: 'standby', uptime: '97.20%', cpu: '0%', mem: '0 MB', icon: ShieldCheck, color: 'purple' },
  { name: 'WebSocket Server', status: 'healthy', uptime: '99.95%', cpu: '5%', mem: '64 MB', icon: Wifi, color: 'emerald' },
  { name: 'Sync Engine', status: 'healthy', uptime: '99.90%', cpu: '8%', mem: '96 MB', icon: HardDrive, color: 'amber' },
];

const logs = [
  { time: '10:45:22', level: 'INFO', message: 'API health check passed — all systems operational' },
  { time: '10:44:18', level: 'INFO', message: 'AI tutor query processed in 185ms for user amara@school.edu' },
  { time: '10:43:55', level: 'WARN', message: 'CV Monitor heartbeat delayed — latency 520ms (threshold: 500ms)' },
  { time: '10:42:30', level: 'INFO', message: 'Database migration completed: added subject column to courses' },
  { time: '10:41:12', level: 'INFO', message: 'Sync batch processed: 14 events from offline client' },
  { time: '10:40:05', level: 'INFO', message: 'New user registered: grace@aau.edu (student role)' },
];

const levelColor: Record<string, string> = { INFO: 'text-emerald-400', WARN: 'text-amber-400', ERROR: 'text-red-400' };

export default function SystemHealth() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">System Health</h1>
        <p className="text-slate-400 text-sm">Infrastructure monitoring and service status</p>
      </motion.div>

      {/* Overall Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glassmorphism p-6 rounded-2xl flex items-center gap-4 border-emerald-500/30"
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
          <Activity className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-emerald-400">All Systems Operational</h3>
          <p className="text-slate-400 text-sm">5 of 6 services running — 1 on standby (CV Monitor)</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-white font-bold text-xl">99.87%</p>
          <p className="text-xs text-slate-500">Platform Uptime</p>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s, idx) => (
          <motion.div key={s.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.05 }}
            className="glassmorphism p-5 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 text-${s.color}-400`} />
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.status === 'standby' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-xs text-slate-400">{s.status}</span>
              </span>
            </div>
            <p className="text-white font-semibold text-sm mb-3">{s.name}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><p className="text-slate-600">Uptime</p><p className="text-slate-300 font-medium">{s.uptime}</p></div>
              <div><p className="text-slate-600">CPU</p><p className="text-slate-300 font-medium">{s.cpu}</p></div>
              <div><p className="text-slate-600">Memory</p><p className="text-slate-300 font-medium">{s.mem}</p></div>
            </div>
          </motion.div>
        ))}
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
