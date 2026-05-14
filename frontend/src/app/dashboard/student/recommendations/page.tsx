'use client';

import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, TrendingUp, Target, Clock, ArrowRight, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';

const recommendations = [
  { id: 1, title: 'Master Integration Techniques', subject: 'Calculus', reason: 'Your score dropped 15% on integral problems', priority: 'high', estimatedTime: '45 min', type: 'lesson' },
  { id: 2, title: 'Trigonometry Refresher', subject: 'Mathematics', reason: 'Prerequisite gaps detected by AI', priority: 'medium', estimatedTime: '30 min', type: 'review' },
  { id: 3, title: 'Practice: Organic Chemistry Reactions', subject: 'Chemistry', reason: 'Similar students improved 22% with this', priority: 'medium', estimatedTime: '25 min', type: 'practice' },
  { id: 4, title: 'Newton\'s Laws Deep Dive', subject: 'Physics', reason: 'Trending topic in upcoming exams', priority: 'low', estimatedTime: '60 min', type: 'lesson' },
  { id: 5, title: 'Statistical Distributions Quiz', subject: 'Statistics', reason: 'High mastery — challenge yourself', priority: 'low', estimatedTime: '20 min', type: 'quiz' },
];

const learningPath = [
  { step: 1, title: 'Review Derivatives', status: 'completed', subject: 'Calculus' },
  { step: 2, title: 'Integration Basics', status: 'completed', subject: 'Calculus' },
  { step: 3, title: 'Integration Techniques', status: 'current', subject: 'Calculus' },
  { step: 4, title: 'Applications of Integrals', status: 'upcoming', subject: 'Calculus' },
  { step: 5, title: 'Differential Equations Intro', status: 'upcoming', subject: 'Calculus' },
];

const colorMap: Record<string, string> = { high: 'text-red-400 bg-red-500/10 border-red-500/20', medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
const typeIcons: Record<string, React.ReactNode> = { lesson: <BookOpen className="w-5 h-5" />, review: <TrendingUp className="w-5 h-5" />, practice: <Target className="w-5 h-5" />, quiz: <BrainCircuit className="w-5 h-5" /> };

export default function Recommendations() {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">AI Recommendations</h1>
        <p className="text-slate-400 text-sm">Personalized learning suggestions powered by your performance data</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations List */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations.map((rec, idx) => (
            <motion.div key={rec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
              className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                  {typeIcons[rec.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-medium">{rec.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[rec.priority]}`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{rec.subject}</p>
                  <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> {rec.reason}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {rec.estimatedTime}</p>
                  <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-auto">
                    Start <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Learning Path */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glassmorphism p-6 rounded-2xl h-fit">
          <h3 className="text-white font-semibold mb-4">Your Learning Path</h3>
          <p className="text-xs text-slate-500 mb-6">AI-generated curriculum for Calculus</p>
          <div className="space-y-1">
            {learningPath.map((step, idx) => (
              <div key={step.step} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' :
                    step.status === 'current' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' :
                    'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    {step.status === 'completed' ? '✓' : step.step}
                  </div>
                  {idx < learningPath.length - 1 && <div className={`w-0.5 h-8 ${step.status === 'completed' ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${step.status === 'current' ? 'text-white' : step.status === 'completed' ? 'text-slate-400' : 'text-slate-600'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-600">{step.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
