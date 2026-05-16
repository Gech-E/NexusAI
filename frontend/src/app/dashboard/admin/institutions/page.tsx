'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, MapPin, Plus, Settings, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
};

interface Institution {
  id: string;
  name: string;
  slug: string;
  location: string;
  students: number;
  teachers: number;
  avgScore: number;
  status: string;
  color: string;
}

export default function Institutions() {
  const accessToken = useAppStore(state => state.accessToken);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutions = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/institutions', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setInstitutions(await res.json());
      } catch (error) {
        console.error('Failed to fetch institutions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Institutions</h1>
          <p className="text-slate-400 text-sm">Manage schools and universities on the platform</p>
        </div>
        <button className="bg-purple-500 hover:bg-purple-400 text-white font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Institution
        </button>
      </motion.div>

      {institutions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No institutions yet</p>
          <p className="text-sm">Add your first institution to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {institutions.map((inst, idx) => {
          const c = colorMap[inst.color] || colorMap.cyan;
          return (
            <motion.div key={inst.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="glassmorphism p-6 rounded-2xl hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center`}>
                  <Building2 className={`w-6 h-6 ${c.text}`} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${inst.status === 'active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                    {inst.status.toUpperCase()}
                  </span>
                  <button className="p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Settings className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="text-white font-semibold mb-1">{inst.name}</h3>
              <p className="text-slate-500 text-xs flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" /> {inst.location}</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Students</p>
                  <p className="text-lg font-bold text-white">{inst.students}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Teachers</p>
                  <p className="text-lg font-bold text-white">{inst.teachers}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Avg</p>
                  <p className={`text-lg font-bold ${inst.avgScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{inst.avgScore}%</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
