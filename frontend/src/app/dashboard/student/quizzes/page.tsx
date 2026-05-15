'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ChevronRight, Loader2, FileText, Play } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';

interface QuizItem {
  id: string;
  title: string;
  school_id: string;
}

interface AttemptItem {
  id: string;
  quiz_id: string;
  started_at: string;
  submitted_at: string | null;
  quiz: { title: string } | null;
  result: { score: number } | null;
}

export default function QuizzesPage() {
  const accessToken = useAppStore(state => state.accessToken);
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'history'>('available');

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      try {
        const [quizzesRes, attemptsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/quizzes', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch('http://localhost:8000/api/v1/quizzes/me/attempts', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        ]);
        if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
        if (attemptsRes.ok) setAttempts(await attemptsRes.json());
      } catch (err) {
        console.error('Failed to fetch quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Quizzes</h1>
        <p className="text-slate-400 text-sm">Take adaptive quizzes and track your scores</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['available', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {t === 'available' ? `Available (${quizzes.length})` : `History (${attempts.length})`}
          </button>
        ))}
      </div>

      {tab === 'available' ? (
        quizzes.length === 0 ? (
          <div className="glassmorphism p-12 rounded-2xl text-center">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No quizzes available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="glassmorphism p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between group hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
                    <p className="text-sm text-slate-500">Quiz ID: {quiz.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/student/quizzes/${quiz.id}`)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" /> Start Quiz
                </button>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        attempts.length === 0 ? (
          <div className="glassmorphism p-12 rounded-2xl text-center">
            <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">No quiz attempts yet. Take your first quiz!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt, idx) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="glassmorphism p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${attempt.submitted_at ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {attempt.submitted_at ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{attempt.quiz?.title || 'Quiz'}</h3>
                    <p className="text-sm text-slate-500">
                      {attempt.submitted_at
                        ? new Date(attempt.submitted_at).toLocaleDateString()
                        : 'In Progress'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {attempt.result && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Score</p>
                      <p className="text-xl font-bold text-emerald-400">{Math.round(attempt.result.score * 100)}%</p>
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
