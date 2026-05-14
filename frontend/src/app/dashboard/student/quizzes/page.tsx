'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const QUIZZES = [
  { id: 1, title: 'Calculus Basics', score: 85, date: '2024-05-10', status: 'Completed' },
  { id: 2, title: 'Machine Learning Intro', score: null, date: 'Pending', status: 'In Progress' },
  { id: 3, title: 'Data Structures 101', score: 92, date: '2024-05-12', status: 'Completed' },
];

export default function QuizzesPage() {
  return (
    <div className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/student" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Your Quizzes</h1>
        </div>

        <div className="space-y-4">
          {QUIZZES.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glassmorphism p-6 rounded-2xl border border-slate-700/50 flex items-center justify-between group cursor-pointer hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  quiz.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                }`}>
                  {quiz.status === 'Completed' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{quiz.title}</h3>
                  <p className="text-sm text-slate-400">{quiz.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {quiz.score !== null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Score</p>
                    <p className="text-xl font-bold text-emerald-400">{quiz.score}%</p>
                  </div>
                )}
                <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
