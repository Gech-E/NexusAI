'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, TrendingUp, Minus } from 'lucide-react';

const users = [
  { id: '1', name: 'Amara Osei', email: 'amara@aau.edu', role: 'student', status: 'active', lastLogin: '2 min ago', institution: 'AAU' },
  { id: '2', name: 'Dr. Kwame Mensah', email: 'kwame@unilag.edu', role: 'teacher', status: 'active', lastLogin: '15 min ago', institution: 'UniLag' },
  { id: '3', name: 'Fatima Hassan', email: 'fatima@uon.edu', role: 'student', status: 'active', lastLogin: '1 hr ago', institution: 'UoN' },
  { id: '4', name: 'Admin User', email: 'admin@nexus.ai', role: 'admin', status: 'active', lastLogin: 'Now', institution: 'Nexus' },
  { id: '5', name: 'Grace Wanjiku', email: 'grace@aau.edu', role: 'student', status: 'inactive', lastLogin: '3 days ago', institution: 'AAU' },
  { id: '6', name: 'Dr. Yusuf Ali', email: 'yusuf@mak.edu', role: 'teacher', status: 'active', lastLogin: '30 min ago', institution: 'Makerere' },
];

const roleBadge: Record<string, string> = { student: 'text-cyan-400 bg-cyan-500/10', teacher: 'text-emerald-400 bg-emerald-500/10', admin: 'text-purple-400 bg-purple-500/10' };

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
        <p className="text-slate-400 text-sm">View and manage all platform users</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500" />
        </div>
        <div className="flex gap-2">
          {['all', 'student', 'teacher', 'admin'].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${roleFilter === r ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
            >{r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glassmorphism rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-slate-800">
              <th className="text-left text-xs font-medium text-slate-500 px-5 py-3">User</th>
              <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Role</th>
              <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Institution</th>
              <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Status</th>
              <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Last Login</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((u, idx) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div><p className="text-sm font-medium text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-4"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[u.role]}`}>{u.role.toUpperCase()}</span></td>
                  <td className="text-center px-3 py-4 text-sm text-slate-400">{u.institution}</td>
                  <td className="text-center px-3 py-4">
                    <span className={`flex items-center justify-center gap-1 text-xs ${u.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />{u.status}
                    </span>
                  </td>
                  <td className="text-right px-5 py-4 text-xs text-slate-500">{u.lastLogin}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
