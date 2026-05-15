'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

const mockExams = [
  { id: 1, title: 'Calculus Mid-Term Practice', subject: 'Mathematics', questions: 25, duration: '45 min', difficulty: 'Medium', completed: false },
  { id: 2, title: 'Physics Forces Quiz', subject: 'Physics', questions: 15, duration: '30 min', difficulty: 'Hard', completed: true, score: 82 },
  { id: 3, title: 'Organic Chemistry Basics', subject: 'Chemistry', questions: 20, duration: '35 min', difficulty: 'Easy', completed: false },
  { id: 4, title: 'English Grammar Review', subject: 'English', questions: 30, duration: '40 min', difficulty: 'Medium', completed: true, score: 91 },
  { id: 5, title: 'Biology Cell Structure', subject: 'Biology', questions: 18, duration: '25 min', difficulty: 'Medium', completed: false },
];

const diffColor: Record<string, string> = { Easy: 'text-emerald-400 bg-emerald-500/10', Medium: 'text-amber-400 bg-amber-500/10', Hard: 'text-red-400 bg-red-500/10' };

export default function PracticeExams() {
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('all');
  const filtered = mockExams.filter(e => filter === 'all' ? true : filter === 'completed' ? e.completed : !e.completed);

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

      <div className="space-y-4">
        {filtered.map((exam, idx) => (
          <motion.div key={exam.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
            className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="text-white font-medium">{exam.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${diffColor[exam.difficulty]}`}>{exam.difficulty}</span>
                </div>
                <p className="text-slate-500 text-sm">{exam.subject}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {exam.questions} questions</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {exam.completed ? (
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-4 h-4" /><span className="text-sm font-semibold">{exam.score}%</span></div>
                    <p className="text-xs text-slate-500 mt-1">Completed</p>
                  </div>
                ) : (
                  <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-2.5 rounded-full text-sm flex items-center gap-2 transition-colors">
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
