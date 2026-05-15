'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const students = [
  { id: '1', name: 'Amara Osei', email: 'amara@school.edu', score: 92, trend: 'up', risk: 'low', quizzes: 18, lastActive: '2 min ago' },
  { id: '2', name: 'Kwame Mensah', email: 'kwame@school.edu', score: 78, trend: 'up', risk: 'low', quizzes: 14, lastActive: '15 min ago' },
  { id: '3', name: 'Fatima Hassan', email: 'fatima@school.edu', score: 65, trend: 'down', risk: 'medium', quizzes: 11, lastActive: '1 hr ago' },
  { id: '4', name: 'Daniel Tadesse', email: 'daniel@school.edu', score: 54, trend: 'down', risk: 'high', quizzes: 8, lastActive: '3 hrs ago' },
  { id: '5', name: 'Grace Wanjiku', email: 'grace@school.edu', score: 88, trend: 'stable', risk: 'low', quizzes: 16, lastActive: '5 min ago' },
  { id: '6', name: 'Yusuf Ali', email: 'yusuf@school.edu', score: 71, trend: 'up', risk: 'medium', quizzes: 12, lastActive: '30 min ago' },
  { id: '7', name: 'Ngozi Eze', email: 'ngozi@school.edu', score: 43, trend: 'down', risk: 'high', quizzes: 5, lastActive: '2 days ago' },
  { id: '8', name: 'Samuel Kipchoge', email: 'samuel@school.edu', score: 85, trend: 'stable', risk: 'low', quizzes: 15, lastActive: '10 min ago' },
];

const trendIcon: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-4 h-4 text-emerald-400" />,
  down: <TrendingDown className="w-4 h-4 text-red-400" />,
  stable: <Minus className="w-4 h-4 text-slate-400" />,
};

const riskBadge: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-red-400 bg-red-500/10',
};

export default function TeacherStudents() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'all' || s.risk === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Student Monitoring</h1>
        <p className="text-slate-400 text-sm">AI-powered risk assessment and performance tracking</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map((r) => (
            <button key={r} onClick={() => setRiskFilter(r)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${riskFilter === r ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
            >{r === 'all' ? 'All' : `${r.charAt(0).toUpperCase() + r.slice(1)} Risk`}</button>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glassmorphism rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">Student</th>
                <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Score</th>
                <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Trend</th>
                <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Risk</th>
                <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Quizzes</th>
                <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((s, idx) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {s.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-4">
                    <span className={`text-sm font-bold ${s.score >= 80 ? 'text-emerald-400' : s.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{s.score}%</span>
                  </td>
                  <td className="text-center px-3 py-4">{trendIcon[s.trend]}</td>
                  <td className="text-center px-3 py-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${riskBadge[s.risk]}`}>{s.risk.toUpperCase()}</span>
                  </td>
                  <td className="text-center px-3 py-4 text-sm text-slate-400">{s.quizzes}</td>
                  <td className="text-right px-5 py-4 text-xs text-slate-500">{s.lastActive}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No students match your filters</div>
        )}
      </motion.div>
    </div>
  );
}
