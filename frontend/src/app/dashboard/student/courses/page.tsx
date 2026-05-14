'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Play, Clock, Star, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const COURSES = [
  { id: 1, title: 'Advanced Mathematics', progress: 45, duration: '12h', level: 'Advanced', image: 'https://images.unsplash.com/photo-1509228468518-180dd4822edb?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Introduction to AI', progress: 10, duration: '8h', level: 'Beginner', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'Data Structures', progress: 85, duration: '15h', level: 'Intermediate', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=400' },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#020617] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/student" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Your Courses</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glassmorphism overflow-hidden rounded-3xl border border-slate-700/50 flex flex-col group"
            >
              <div className="h-48 overflow-hidden relative">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs text-white border border-white/10">
                  {course.level}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-2">{course.title}</h2>
                <div className="flex items-center gap-4 text-slate-400 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" /> 4.9
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-cyan-400 font-medium">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      className="h-full bg-cyan-500" 
                    />
                  </div>
                  <button className="w-full mt-6 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 fill-current" /> Continue
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
