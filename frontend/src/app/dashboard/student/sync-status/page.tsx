'use client';

import { motion } from 'framer-motion';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw, Check, AlertTriangle, Database, HardDrive } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const syncItems = [
  { type: 'Quiz Results', local: 12, synced: 10, pending: 2, lastSync: '2 min ago', status: 'partial' },
  { type: 'AI Conversations', local: 45, synced: 45, pending: 0, lastSync: '5 min ago', status: 'synced' },
  { type: 'Course Progress', local: 8, synced: 8, pending: 0, lastSync: '1 min ago', status: 'synced' },
  { type: 'Analytics Events', local: 234, synced: 220, pending: 14, lastSync: '10 min ago', status: 'partial' },
  { type: 'Recommendations', local: 5, synced: 3, pending: 2, lastSync: '15 min ago', status: 'partial' },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  synced: { icon: <Check className="w-4 h-4" />, color: 'text-emerald-400', label: 'Synced' },
  partial: { icon: <RefreshCw className="w-4 h-4" />, color: 'text-amber-400', label: 'Pending' },
  error: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', label: 'Error' },
};

export default function SyncStatus() {
  const isOffline = useAppStore(state => state.isOffline);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Offline Sync Status</h1>
        <p className="text-slate-400 text-sm">Monitor data synchronization between local storage and cloud</p>
      </motion.div>

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className={`glassmorphism p-6 rounded-2xl flex items-center gap-4 ${isOffline ? 'border-amber-500/30' : 'border-emerald-500/30'}`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isOffline ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
          {isOffline ? <WifiOff className="w-7 h-7 text-amber-400" /> : <Wifi className="w-7 h-7 text-emerald-400" />}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${isOffline ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isOffline ? 'Offline Mode' : 'Connected'}
          </h3>
          <p className="text-slate-400 text-sm">
            {isOffline ? 'Data will sync when connection is restored' : 'All systems connected — sync active'}
          </p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Force Sync
        </button>
      </motion.div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glassmorphism p-5 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">Local Storage</h3>
          </div>
          <p className="text-2xl font-bold text-white">24.8 MB</p>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-cyan-500 rounded-full" style={{ width: '25%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">24.8 MB of 100 MB used</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glassmorphism p-5 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <Cloud className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Cloud Sync</h3>
          </div>
          <p className="text-2xl font-bold text-white">286 / 304</p>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">94% synced — 18 items pending</p>
        </motion.div>
      </div>

      {/* Sync Items */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glassmorphism rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Sync Details</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {syncItems.map((item) => {
            const status = statusConfig[item.status];
            return (
              <div key={item.type} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <Database className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.type}</p>
                  <p className="text-xs text-slate-500">{item.local} local / {item.synced} synced</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`flex items-center gap-1 ${status.color}`}>
                    {status.icon}
                    <span className="text-xs font-medium">{item.pending > 0 ? `${item.pending} pending` : status.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{item.lastSync}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
