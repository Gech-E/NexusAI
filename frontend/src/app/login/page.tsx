'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { apiPost, apiGet } from '@/lib/api';
import { toast } from '@/components/ui/Toaster';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAppStore(state => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { access_token, refresh_token } = await apiPost<{ access_token: string; refresh_token: string }>(
        '/api/v1/auth/login',
        { email, password },
        { noAuth: true }
      );

      const userData = await apiGet<{ id: string; email: string; full_name: string; roles: string[] }>(
        '/api/v1/users/me',
        { headers: { Authorization: `Bearer ${access_token}` } as Record<string, string>, noAuth: true }
      );

      const firstName = userData.full_name.split(' ')[0];
      const role = userData.roles.includes('admin') ? 'admin' : (userData.roles.includes('teacher') ? 'teacher' : 'student');

      setAuth(
        { ...userData, firstName, role },
        access_token,
        refresh_token
      );

      toast.success(`Welcome back, ${firstName}!`);
      router.push(`/dashboard/${role}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during login.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617] p-6">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glassmorphism rounded-3xl p-8 sm:p-10 border border-slate-700/50 shadow-2xl">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <BrainCircuit className="w-10 h-10 text-cyan-400" />
              <span className="text-2xl font-bold tracking-tight text-white">Nexus<span className="text-cyan-400">LearnAI</span></span>
            </Link>
          </div>

          <h2 className="text-2xl font-semibold text-white text-center mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-center mb-8 text-sm">Sign in to your offline-first smart learning account.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="you@school.edu"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-400 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500 mr-2" />
                Remember me
              </label>
              <span className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">Forgot password?</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl py-3 px-4 transition-all flex items-center justify-center mt-6 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
