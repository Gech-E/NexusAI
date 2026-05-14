'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Users, BookOpen, TrendingUp, Plus, Settings } from 'lucide-react';

const classes = [
  { id: 1, name: 'Grade 10A — Mathematics', students: 32, avgScore: 78, courses: 4, color: 'cyan' },
  { id: 2, name: 'Grade 10B — Mathematics', students: 28, avgScore: 72, courses: 4, color: 'emerald' },
  { id: 3, name: 'Grade 11A — Physics', students: 25, avgScore: 82, courses: 3, color: 'purple' },
  { id: 4, name: 'Grade 11B — Chemistry', students: 30, avgScore: 68, courses: 5, color: 'amber' },
];

const colors: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
};

export default function Classes() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Class Management</h1>
          <p className="text-slate-400 text-sm">Organize and monitor your classroom groups</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Class
        </button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls, idx) => {
          const c = colors[cls.color];
          return (
            <motion.div key={cls.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="glassmorphism p-6 rounded-2xl hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center`}>
                  <GraduationCap className={`w-6 h-6 ${c.text}`} />
                </div>
                <button className="p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-white font-semibold mb-3">{cls.name}</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Students</p>
                  <p className="text-lg font-bold text-white">{cls.students}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Avg Score</p>
                  <p className={`text-lg font-bold ${cls.avgScore >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{cls.avgScore}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Courses</p>
                  <p className="text-lg font-bold text-white">{cls.courses}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
