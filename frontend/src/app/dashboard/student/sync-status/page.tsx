'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, Wifi, Cloud, RefreshCw, Check, AlertTriangle, Database, HardDrive, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface SyncLog {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: string;
  status: string;
  device_id: string;
  created_at: string | null;
}

interface SyncData {
  total_records: number;
  synced: number;
  failed: number;
  pending: number;
  last_sync: string | null;
  recent_logs: SyncLog[];
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  synced: { icon: <Check className="w-4 h-4" />, color: 'text-emerald-400', label: 'Synced' },
  pending: { icon: <RefreshCw className="w-4 h-4" />, color: 'text-amber-400', label: 'Pending' },
  failed: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400', label: 'Failed' },
};

export default function SyncStatus() {
  const accessToken = useAppStore(state => state.accessToken);
  const isOffline = useAppStore(state => state.isOffline);
  const [data, setData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/sync/status', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  const total = data?.total_records || 0;
  const synced = data?.synced || 0;
  const syncPct = total > 0 ? Math.round((synced / total) * 100) : 100;

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
        <button onClick={fetchStatus} className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glassmorphism p-5 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-medium">Total Records</h3>
          </div>
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-slate-500 mt-2">{data?.pending || 0} pending sync</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glassmorphism p-5 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <Cloud className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">Cloud Sync</h3>
          </div>
          <p className="text-2xl font-bold text-white">{synced} / {total}</p>
          <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${syncPct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{syncPct}% synced{data?.failed ? ` — ${data.failed} failed` : ''}</p>
        </motion.div>
      </div>

      {/* Recent Sync Logs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glassmorphism rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-white font-semibold">Sync Details</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {(data?.recent_logs || []).length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">No sync records yet</div>
          )}
          {(data?.recent_logs || []).map((log) => {
            const status = statusConfig[log.status] || statusConfig.synced;
            return (
              <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                <Database className="w-5 h-5 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{log.entity_type}</p>
                  <p className="text-xs text-slate-500">{log.operation} — {log.device_id}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`flex items-center gap-1 ${status.color}`}>
                    {status.icon}
                    <span className="text-xs font-medium">{status.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
