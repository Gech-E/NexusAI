'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BrainCircuit, ArrowRight, ClipboardCheck, GraduationCap, TrendingUp, RefreshCw, WifiOff, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiGet } from '@/lib/api';

type Summary = { skill_mastery: number; completed_quizzes: number; enrolled_courses: number; pending_assignments: number };
type Course = { course_id: string; course_title: string; subject: string; progress: number };
type Quiz = { id: string; title: string; school_id: string };

const quickLinks = [
  { title: 'My courses', description: 'Pick up where you left off', href: '/dashboard/student/courses', icon: BookOpen, accent: 'text-cyan-300 bg-cyan-500/10' },
  { title: 'Practice quizzes', description: 'Test what you have learned', href: '/dashboard/student/quizzes', icon: ClipboardCheck, accent: 'text-violet-300 bg-violet-500/10' },
  { title: 'AI study assistant', description: 'Ask questions and explore topics', href: '/dashboard/student/ai-tutor', icon: BrainCircuit, accent: 'text-emerald-300 bg-emerald-500/10' },
];

export default function StudentDashboard() {
  const user = useAppStore(state => state.user);
  const isOffline = useAppStore(state => state.isOffline);
  const [stats, setStats] = useState<Summary | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const outcomes = await Promise.allSettled([
      apiGet<Summary>('/api/v1/analytics/me/summary'),
      apiGet<Course[]>('/api/v1/courses/me/enrolled'),
      apiGet<Quiz[]>('/api/v1/quizzes'),
    ]);
    if (outcomes[0].status === 'fulfilled') setStats(outcomes[0].value);
    if (outcomes[1].status === 'fulfilled') setCourses(outcomes[1].value);
    if (outcomes[2].status === 'fulfilled') setQuizzes(outcomes[2].value);
    if (outcomes.every(result => result.status === 'rejected')) setError('We could not load your learning dashboard. Check your connection and try again.');
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const firstName = user?.firstName || user?.full_name?.split(' ')[0] || 'Learner';

  return <div className="mx-auto max-w-6xl space-y-7 pb-12">
    <section className="relative overflow-hidden rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 px-6 py-8 sm:px-10 sm:py-10">
      <div aria-hidden="true" className="absolute right-[-40px] top-[-90px] h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative max-w-2xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200"><Sparkles size={14}/> YOUR LEARNING SPACE</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Welcome back, {firstName}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">Build your skills one lesson at a time. Keep learning at your own pace, review your progress and explore new subjects.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/student/courses" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Continue learning <ArrowRight size={17}/></Link>
          <Link href="/dashboard/student/ai-tutor" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><BrainCircuit size={17}/> Ask AI tutor</Link>
        </div>
      </div>
    </section>

    {isOffline && <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100"><WifiOff size={19} className="shrink-0"/> You are offline. Some resources may be unavailable until you reconnect.</div>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200"><span>{error}</span><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3 py-2"><RefreshCw size={15}/> Retry</button></div>}

    <section aria-label="Learning overview">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Learning overview</h2><Link href="/dashboard/student/analytics" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">View insights <ArrowRight size={14} className="inline"/></Link></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'My courses', value: stats?.enrolled_courses, suffix: '', icon: BookOpen },
          { label: 'Completed quizzes', value: stats?.completed_quizzes, suffix: '', icon: ClipboardCheck },
          { label: 'Average quiz score', value: stats?.skill_mastery, suffix: '%', icon: TrendingUp },
          { label: 'Quizzes in progress', value: stats?.pending_assignments, suffix: '', icon: GraduationCap },
        ].map(item => <div key={item.label} className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 sm:p-5"><item.icon size={20} className="mb-4 text-cyan-300"/><p className="text-2xl font-bold text-white sm:text-3xl">{loading ? '…' : item.value === undefined ? '—' : `${item.value}${item.suffix}`}</p><p className="mt-2 text-xs text-slate-400 sm:text-sm">{item.label}</p></div>)}
      </div>
    </section>

    <section>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Continue your courses</h2><Link href="/dashboard/student/courses" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">All courses <ArrowRight size={14} className="inline"/></Link></div>
      {courses.length ? <div className="grid gap-4 md:grid-cols-2">{courses.slice(0,4).map(course => <Link key={course.course_id} href={`/dashboard/student/courses/${course.course_id}`} className="group rounded-2xl border border-slate-700/60 bg-slate-900/75 p-5 transition hover:border-cyan-400/50 hover:bg-slate-900"><div className="mb-4 flex items-start justify-between"><span className="rounded-lg bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">{course.subject}</span><ArrowRight size={17} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300"/></div><h3 className="mb-4 text-lg font-semibold text-white">{course.course_title}</h3><div className="mb-2 flex justify-between text-xs text-slate-400"><span>Course progress</span><span>{Math.max(0,Math.min(100,Math.round(course.progress || 0)))}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(0,Math.min(100,course.progress || 0))}%` }}/></div></Link>)}</div> :
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center"><BookOpen size={26} className="mx-auto mb-3 text-slate-400"/><h3 className="font-semibold text-white">{loading ? 'Loading courses…' : 'Your learning journey starts here'}</h3><p className="mt-2 text-sm text-slate-400">Browse available courses and enroll to track your progress.</p><Link href="/dashboard/student/courses" className="mt-4 inline-flex rounded-xl bg-slate-800 px-4 py-2 text-sm text-cyan-300">Explore courses <ArrowRight size={16} className="ml-2"/></Link></div>}
    </section>

    <section><h2 className="mb-4 text-xl font-bold text-white">Explore learning tools</h2><div className="grid gap-4 md:grid-cols-3">{quickLinks.map(link => <Link key={link.href} href={link.href} className="group flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-slate-500"><div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${link.accent}`}><link.icon size={22}/></div><h3 className="font-semibold text-white">{link.title}</h3><p className="mt-2 flex-1 text-sm text-slate-400">{link.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-cyan-300">Open <ArrowRight size={15} className="transition group-hover:translate-x-1"/></span></Link>)}</div></section>
    {quizzes.length > 0 && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-700/70 bg-slate-900 p-5"><div><h2 className="font-semibold text-white">Ready for a knowledge check?</h2><p className="mt-1 text-sm text-slate-400">{quizzes.length} available quiz{quizzes.length === 1 ? '' : 'zes'} in your learning space.</p></div><Link href="/dashboard/student/quizzes" className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">View quizzes <ArrowRight size={16}/></Link></section>}
  </div>;
}
