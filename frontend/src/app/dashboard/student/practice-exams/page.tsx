'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface QuizItem {
  id: string;
  title: string;
  school_id: string;
}

interface AttemptItem {
  id: string;
  quiz_id: string;
  submitted_at: string | null;
  result?: { score: number } | null;
}

export default function PracticeExams() {
  const accessToken = useAppStore(state => state.accessToken);
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        const [quizRes, attRes] = await Promise.all([
          fetch(apiUrl('/api/v1/quizzes'), { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(apiUrl('/api/v1/quizzes/me/attempts'), { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        ]);
        if (quizRes.ok) setQuizzes(await quizRes.json());
        if (attRes.ok) setAttempts(await attRes.json());
      } catch (error) {
        console.error('Failed to fetch practice exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  // Build exam list with completion status
  const completedQuizIds = new Set(
    attempts.filter(a => a.submitted_at).map(a => a.quiz_id)
  );
  const attemptScoreMap: Record<string, number> = {};
  attempts.forEach(a => {
    if (a.submitted_at && a.result) {
      const score = typeof a.result.score === 'number' ? Math.round(a.result.score * 100) : a.result.score;
      attemptScoreMap[a.quiz_id] = score;
    }
  });

  const exams = quizzes.map(q => ({
    id: q.id,
    title: q.title,
    completed: completedQuizIds.has(q.id),
    score: attemptScoreMap[q.id] || 0,
  }));

  const filtered = exams.filter(e => filter === 'all' ? true : filter === 'completed' ? e.completed : !e.completed);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Practice Exams</h1>
        <p className="text-slate-400 text-sm">Adaptive difficulty exams powered by AI</p>
      </motion.div>

      <div className="flex gap-2">
        {(['all', 'available', 'completed'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium text-slate-400">No exams found</p>
          <p className="text-sm">Check back when your teacher creates new quizzes.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((exam, idx) => (
          <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="text-white font-medium">{exam.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${exam.completed ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                    {exam.completed ? 'Completed' : 'Available'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Practice</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> No time limit</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {exam.completed ? (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-4 h-4" /><span className="text-sm font-semibold">{exam.score}%</span></div>
                    <p className="text-xs text-slate-500 mt-1">Completed</p>
                  </div>
                ) : (
                  <button onClick={() => router.push(`/dashboard/student/quizzes/${exam.id}`)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors">
                    Start <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
