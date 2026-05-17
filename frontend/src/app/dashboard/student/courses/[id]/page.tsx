'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, BrainCircuit, Play, ChevronLeft, Loader2, Award } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

interface CourseDetail {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  quiz_count: number;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const accessToken = useAppStore(state => state.accessToken);
  
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!accessToken || !courseId) return;
      try {
        const [courseRes, enrolledRes] = await Promise.all([
          fetch(apiUrl(`/api/v1/courses/${courseId}`), { headers: { 'Authorization': `Bearer ${accessToken}` } }),
          fetch(apiUrl('/api/v1/courses/me/enrolled'), { headers: { 'Authorization': `Bearer ${accessToken}` } })
        ]);
        
        if (courseRes.ok) {
          setCourse(await courseRes.json());
        }
        
        if (enrolledRes.ok) {
          const enrolledData = await enrolledRes.json();
          const currentEnrollment = enrolledData.find((e: any) => e.course_id === courseId);
          if (currentEnrollment) {
            setProgress(currentEnrollment.progress);
          }
        }
      } catch (error) {
        console.error('Failed to load course details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [accessToken, courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold text-white mb-2">Course Not Found</h2>
        <button onClick={() => router.push('/dashboard/student/courses')} className="text-cyan-400 hover:underline">
          Return to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => router.push('/dashboard/student/courses')}
        className="flex items-center text-sm text-slate-400 hover:text-cyan-400 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Courses
      </button>

      <div className="glassmorphism p-8 rounded-3xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-medium mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              {course.subject}
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed">
              {course.description || "Explore the fundamental concepts and master the material through adaptive quizzes and AI-assisted learning."}
            </p>
          </div>
          
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 min-w-[200px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Your Progress</span>
              <span className="text-xl font-bold text-cyan-400">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-cyan-500 rounded-full" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glassmorphism p-6 rounded-2xl border border-slate-700/50 flex flex-col hover:border-cyan-500/30 transition-all cursor-pointer group"
          onClick={() => router.push('/dashboard/student/quizzes')}
        >
          <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Play className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Take a Quiz</h2>
          <p className="text-slate-400 text-sm flex-1">Test your knowledge with adaptive quizzes tailored to your progress in this course.</p>
          <div className="mt-4 flex items-center text-emerald-400 text-sm font-medium">
            Start Learning <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glassmorphism p-6 rounded-2xl border border-slate-700/50 flex flex-col hover:border-cyan-500/30 transition-all cursor-pointer group"
          onClick={() => router.push('/dashboard/student/ai-tutor')}
        >
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <BrainCircuit className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ask AI Tutor</h2>
          <p className="text-slate-400 text-sm flex-1">Stuck on a concept? Chat with your personalized AI tutor for deep explanations.</p>
          <div className="mt-4 flex items-center text-cyan-400 text-sm font-medium">
            Open Chat <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
