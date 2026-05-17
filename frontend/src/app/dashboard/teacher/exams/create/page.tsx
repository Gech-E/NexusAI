'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface QuestionForm {
  prompt: string;
  choices: string[];
  correct_index: number;
  difficulty: number;
  topic_tags: string[];
}

export default function CreateExam() {
  const accessToken = useAppStore(state => state.accessToken);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { prompt: '', choices: ['', '', '', ''], correct_index: 0, difficulty: 0.5, topic_tags: [] }
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { prompt: '', choices: ['', '', '', ''], correct_index: 0, difficulty: 0.5, topic_tags: [] }]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string | number | string[]) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx ? { ...q, choices: q.choices.map((c, j) => j === cIdx ? value : c) } : q
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setLoading(true);
    try {
      const payload = {
        title, description,
        school_id: '00000000-0000-0000-0000-000000000001',
        questions: questions.map(q => ({ ...q, topic_tags: q.topic_tags.length ? q.topic_tags : [title.toLowerCase()] }))
      };
      const res = await fetch(apiUrl('/api/v1/quizzes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard/teacher/exams'), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <p className="text-white font-semibold text-lg">Exam Created Successfully!</p>
        <p className="text-slate-500 text-sm">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Create Exam</h1>
        <p className="text-slate-400 text-sm">Build adaptive quizzes with AI-assisted question management</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glassmorphism p-6 rounded-2xl space-y-4"
        >
          <h3 className="text-white font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Exam Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
              placeholder="e.g., Calculus Mid-Term Exam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 resize-none"
              placeholder="Brief description of the exam..."
            />
          </div>
        </motion.div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <motion.div key={qIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + qIdx * 0.05 }}
              className="glassmorphism p-6 rounded-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium text-sm">Question {qIdx + 1}</h4>
                <div className="flex items-center gap-2">
                  <select value={q.difficulty} onChange={(e) => updateQuestion(qIdx, 'difficulty', parseFloat(e.target.value))}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value={0.2}>Easy</option>
                    <option value={0.5}>Medium</option>
                    <option value={0.8}>Hard</option>
                  </select>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qIdx)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <textarea value={q.prompt} onChange={(e) => updateQuestion(qIdx, 'prompt', e.target.value)} required rows={2}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 resize-none"
                placeholder="Enter the question..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.choices.map((choice, cIdx) => (
                  <div key={cIdx} className="relative">
                    <input type="text" value={choice} onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)} required
                      className={`w-full border rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500 ${
                        q.correct_index === cIdx ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-900/50 border-slate-700 text-white'
                      }`}
                      placeholder={`Choice ${String.fromCharCode(65 + cIdx)}`}
                    />
                    <button type="button" onClick={() => updateQuestion(qIdx, 'correct_index', cIdx)}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        q.correct_index === cIdx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {q.correct_index === cIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={addQuestion}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button type="submit" disabled={loading || !title || questions.some(q => !q.prompt || q.choices.some(c => !c))}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Exam'}
          </button>
        </div>
      </form>
    </div>
  );
}
