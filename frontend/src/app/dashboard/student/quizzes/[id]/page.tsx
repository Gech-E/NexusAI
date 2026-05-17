'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Loader2, CheckCircle2, XCircle, Trophy, ArrowLeft, Send } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

interface QuestionItem {
  id: string;
  prompt: string;
  choices: string[];
  difficulty: number;
  topic_tags: string[];
}

interface QuizData {
  attempt_id: string;
  quiz_title: string;
  description: string | null;
  questions: QuestionItem[];
  total_questions: number;
}

interface FeedbackItem {
  question_id: string;
  prompt: string;
  selected_index: number;
  correct_index: number;
  is_correct: boolean;
  choices: string[];
}

interface QuizResult {
  score: number;
  correct_count: number;
  total_questions: number;
  percentage: number;
  feedback: FeedbackItem[];
}

type Phase = 'loading' | 'quiz' | 'submitting' | 'results';

export default function QuizTakingPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const accessToken = useAppStore(state => state.accessToken);

  const [phase, setPhase] = useState<Phase>('loading');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');

  // Start quiz
  useEffect(() => {
    const startQuiz = async () => {
      if (!accessToken || !quizId) return;
      try {
        const res = await fetch(apiUrl(`/api/v1/quizzes/${quizId}/start`), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setQuizData(data);
          setPhase('quiz');
        } else {
          const err = await res.json();
          setError(err.detail || 'Failed to start quiz');
        }
      } catch {
        setError('Failed to connect to server');
      }
    };
    startQuiz();
  }, [accessToken, quizId]);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const selectAnswer = (questionId: string, choiceIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: choiceIndex }));
  };

  const handleSubmit = async () => {
    if (!accessToken || !quizData) return;
    setPhase('submitting');
    try {
      const res = await fetch(apiUrl(`/api/v1/quizzes/${quizId}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        setResult(await res.json());
        setPhase('results');
      } else {
        setError('Failed to submit quiz');
        setPhase('quiz');
      }
    } catch {
      setError('Failed to connect to server');
      setPhase('quiz');
    }
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-[60vh] gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-white font-semibold">{error}</p>
        <button onClick={() => router.back()} className="text-cyan-400 text-sm hover:text-cyan-300">Go Back</button>
      </div>
    );
  }

  if (phase === 'loading' || phase === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm">{phase === 'loading' ? 'Loading quiz...' : 'Submitting answers...'}</p>
      </div>
    );
  }

  // ─── RESULTS SCREEN ────────────────────────────────────────────
  if (phase === 'results' && result) {
    const passed = result.percentage >= 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className={`glassmorphism p-10 rounded-3xl text-center border ${passed ? 'border-emerald-500/30' : 'border-amber-500/30'}`}
        >
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${passed ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <Trophy className={`w-12 h-12 ${passed ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{passed ? 'Great Job!' : 'Keep Practicing!'}</h1>
          <p className="text-slate-400 mb-6">{quizData?.quiz_title}</p>

          <div className="flex justify-center gap-8 mb-8">
            <div>
              <p className={`text-4xl font-bold ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>{result.percentage}%</p>
              <p className="text-xs text-slate-500 mt-1">Score</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{result.correct_count}/{result.total_questions}</p>
              <p className="text-xs text-slate-500 mt-1">Correct</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{formatTime(elapsed)}</p>
              <p className="text-xs text-slate-500 mt-1">Time</p>
            </div>
          </div>

          <button onClick={() => router.push('/dashboard/student/quizzes')}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-8 py-3 rounded-full transition-colors"
          >Back to Quizzes</button>
        </motion.div>

        {/* Feedback Details */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Question Review</h3>
          {result.feedback.map((fb, idx) => (
            <motion.div key={fb.question_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`glassmorphism p-5 rounded-2xl border ${fb.is_correct ? 'border-emerald-500/20' : 'border-red-500/20'}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${fb.is_correct ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {fb.is_correct ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-white text-sm font-medium">{fb.prompt}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-11">
                {fb.choices.map((choice, cIdx) => (
                  <div key={cIdx} className={`px-3 py-2 rounded-lg text-xs border ${
                    cIdx === fb.correct_index ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' :
                    cIdx === fb.selected_index && !fb.is_correct ? 'bg-red-500/10 border-red-500/30 text-red-300' :
                    'bg-slate-800/50 border-slate-700 text-slate-400'
                  }`}>
                    <span className="font-semibold mr-1">{String.fromCharCode(65 + cIdx)}.</span> {choice}
                    {cIdx === fb.correct_index && <span className="ml-1">✓</span>}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── QUIZ TAKING SCREEN ────────────────────────────────────────
  if (!quizData) return null;
  const question = quizData.questions[currentQ];
  const totalQ = quizData.total_questions;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{quizData.quiz_title}</h1>
            <p className="text-xs text-slate-500">Question {currentQ + 1} of {totalQ}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-white">{formatTime(elapsed)}</span>
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
        />
      </div>

      {/* Question dots */}
      <div className="flex gap-1.5 flex-wrap">
        {quizData.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQ(idx)}
            className={`w-8 h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
              idx === currentQ
                ? 'bg-cyan-500 text-slate-900'
                : answers[q.id] !== undefined
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="glassmorphism p-8 rounded-3xl"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              question.difficulty <= 0.3 ? 'text-emerald-400 bg-emerald-500/10' :
              question.difficulty <= 0.6 ? 'text-amber-400 bg-amber-500/10' :
              'text-red-400 bg-red-500/10'
            }`}>
              {question.difficulty <= 0.3 ? 'EASY' : question.difficulty <= 0.6 ? 'MEDIUM' : 'HARD'}
            </span>
          </div>

          <h2 className="text-xl font-semibold text-white mb-8 leading-relaxed">{question.prompt}</h2>

          <div className="space-y-3">
            {question.choices.map((choice, cIdx) => {
              const isSelected = answers[question.id] === cIdx;
              return (
                <button
                  key={cIdx}
                  onClick={() => selectAnswer(question.id, cIdx)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-900'
                      : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                  }`}>
                    {String.fromCharCode(65 + cIdx)}
                  </span>
                  <span className="text-sm">{choice}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <p className="text-xs text-slate-500">{answeredCount} of {totalQ} answered</p>

        {currentQ < totalQ - 1 ? (
          <button
            onClick={() => setCurrentQ(prev => Math.min(totalQ - 1, prev + 1))}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < totalQ}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-5 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
