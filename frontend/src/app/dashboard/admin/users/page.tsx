'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const roleBadge: Record<string, string> = { student: 'text-cyan-400 bg-cyan-500/10', teacher: 'text-emerald-400 bg-emerald-500/10', admin: 'text-purple-400 bg-purple-500/10' };

interface UserItem {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  institution: string | null;
  is_active: boolean;
  created_at: string | null;
}

export default function AdminUsers() {
  const accessToken = useAppStore(state => state.accessToken);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/admin/users', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) setUsers(await res.json());
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [accessToken]);

  const toggleActive = async (userId: string) => {
    if (!accessToken) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const result = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: result.is_active } : u));
      }
    } catch (error) {
      console.error('Failed to toggle user:', error);
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>;

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
              <th className="text-right text-xs font-medium text-slate-500 px-5 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((u, idx) => (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div><p className="text-sm font-medium text-white">{u.full_name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="text-center px-3 py-4">
                    {u.roles.map(role => (
                      <span key={role} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge[role] || 'text-slate-400 bg-slate-500/10'} mr-1`}>{role.toUpperCase()}</span>
                    ))}
                  </td>
                  <td className="text-center px-3 py-4 text-sm text-slate-400">{u.institution || '—'}</td>
                  <td className="text-center px-3 py-4">
                    <span className={`flex items-center justify-center gap-1 text-xs ${u.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`} />{u.is_active ? 'active' : 'disabled'}
                    </span>
                  </td>
                  <td className="text-right px-5 py-4">
                    <button onClick={() => toggleActive(u.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                    >{u.is_active ? 'Disable' : 'Enable'}</button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
