'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, BookOpen, TrendingUp, Target, Clock, ArrowRight, BrainCircuit, RefreshCw, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface RecommendationItem {
  id: string;
  resource_type: string;
  title: string;
  reason: string;
  score: number;
  created_at: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  lesson: <BookOpen className="w-5 h-5" />,
  review: <TrendingUp className="w-5 h-5" />,
  practice: <Target className="w-5 h-5" />,
  quiz: <BrainCircuit className="w-5 h-5" />,
};

const priorityFromScore = (score: number) => {
  if (score >= 0.9) return { label: 'HIGH', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  if (score >= 0.75) return { label: 'MEDIUM', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { label: 'LOW', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
};

const learningPath = [
  { step: 1, title: 'Review Derivatives', status: 'completed', subject: 'Calculus' },
  { step: 2, title: 'Integration Basics', status: 'completed', subject: 'Calculus' },
  { step: 3, title: 'Integration Techniques', status: 'current', subject: 'Calculus' },
  { step: 4, title: 'Applications of Integrals', status: 'upcoming', subject: 'Calculus' },
  { step: 5, title: 'Differential Equations Intro', status: 'upcoming', subject: 'Calculus' },
];

export default function Recommendations() {
  const accessToken = useAppStore(state => state.accessToken);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecs = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/recommendations/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) setRecommendations(await res.json());
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, [accessToken]);

  const handleRefresh = async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try {
      await fetch('http://127.0.0.1:8000/api/v1/recommendations/me/refresh', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      await fetchRecs();
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">AI Recommendations</h1>
          <p className="text-slate-400 text-sm">Personalized learning suggestions powered by your performance data</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing}
          className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations List */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations.length === 0 ? (
            <div className="glassmorphism p-12 rounded-2xl text-center">
              <Lightbulb className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No recommendations yet</p>
              <button onClick={handleRefresh}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
              >Generate Recommendations</button>
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const priority = priorityFromScore(rec.score);
              return (
                <motion.div key={rec.id || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                  className="glassmorphism p-5 rounded-2xl hover:border-slate-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                      {typeIcons[rec.resource_type] || <Lightbulb className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-white font-medium">{rec.title}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.color}`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm capitalize">{rec.resource_type}</p>
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> {rec.reason}</p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-slate-500">Relevance: {Math.round(rec.score * 100)}%</p>
                      <button className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-auto">
                        Start <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
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
