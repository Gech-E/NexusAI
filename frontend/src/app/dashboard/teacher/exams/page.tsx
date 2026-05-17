'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

interface Quiz { id: string; title: string; school_id: string; }

export default function ExamsList() {
  const router = useRouter();
  const accessToken = useAppStore(state => state.accessToken);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(apiUrl('/api/v1/quizzes'), { headers: { 'Authorization': `Bearer ${accessToken}` } });
        if (res.ok) setQuizzes(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchQuizzes();
  }, [accessToken]);

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Exams & Quizzes</h1>
          <p className="text-slate-400 text-sm">Manage your assessments</p>
        </div>
        <button onClick={() => router.push('/dashboard/teacher/exams/create')}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Exam
        </button>
      </motion.div>

      {quizzes.length === 0 ? (
        <div className="glassmorphism p-12 rounded-2xl text-center">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No exams created yet</p>
          <button onClick={() => router.push('/dashboard/teacher/exams/create')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >Create Your First Exam</button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz, idx) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-11 h-11 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{quiz.title}</h3>
                <p className="text-xs text-slate-500">ID: {quiz.id.slice(0, 8)}...</p>
              </div>
              <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-medium border border-slate-700 transition-colors">
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
