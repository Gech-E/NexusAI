'use client';

import { motion } from 'framer-motion';
import { Building2, Users, TrendingUp, MapPin, Plus, Settings } from 'lucide-react';

const institutions = [
  { id: 1, name: 'Addis Ababa University', location: 'Addis Ababa, Ethiopia', students: 420, teachers: 38, avgScore: 76, status: 'active', color: 'cyan' },
  { id: 2, name: 'University of Lagos', location: 'Lagos, Nigeria', students: 310, teachers: 28, avgScore: 72, status: 'active', color: 'emerald' },
  { id: 3, name: 'University of Nairobi', location: 'Nairobi, Kenya', students: 185, teachers: 22, avgScore: 80, status: 'active', color: 'purple' },
  { id: 4, name: 'Makerere University', location: 'Kampala, Uganda', students: 95, teachers: 14, avgScore: 68, status: 'active', color: 'amber' },
  { id: 5, name: 'Delhi Public School', location: 'New Delhi, India', students: 73, teachers: 12, avgScore: 82, status: 'pending', color: 'blue' },
];

const colors: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
};

export default function Institutions() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {institutions.map((inst, idx) => {
          const c = colors[inst.color];
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
