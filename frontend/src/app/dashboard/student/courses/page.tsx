'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface CourseItem {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  school_id: string;
}

interface EnrolledCourse {
  course_id: string;
  course_title: string;
  subject: string;
  progress: number;
}

export default function CoursesPage() {
  const router = useRouter();
  const accessToken = useAppStore(state => state.accessToken);
  const [allCourses, setAllCourses] = useState<CourseItem[]>([]);
  const [enrolled, setEnrolled] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [tab, setTab] = useState<'enrolled' | 'browse'>('enrolled');

  const fetchData = async () => {
    if (!accessToken) return;
    try {
      const [coursesRes, enrolledRes] = await Promise.all([
        fetch(apiUrl('/api/v1/courses'), { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch(apiUrl('/api/v1/courses/me/enrolled'), { headers: { 'Authorization': `Bearer ${accessToken}` } }),
      ]);
      if (coursesRes.ok) setAllCourses(await coursesRes.json());
      if (enrolledRes.ok) setEnrolled(await enrolledRes.json());
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [accessToken]);

  const handleEnroll = async (courseId: string) => {
    if (!accessToken) return;
    setEnrolling(courseId);
    try {
      const res = await fetch(apiUrl(`/api/v1/courses/${courseId}/enroll`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (res.ok) {
        await fetchData();
        setTab('enrolled');
      }
    } catch (err) {
      console.error('Enroll failed:', err);
    } finally {
      setEnrolling(null);
    }
  };

  const enrolledIds = new Set(enrolled.map(e => e.course_id));
  const availableCourses = allCourses.filter(c => !enrolledIds.has(c.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white mb-1">Courses</h1>
        <p className="text-slate-400 text-sm">Browse, enroll, and track your progress</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['enrolled', 'browse'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === t ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
          >
            {t === 'enrolled' ? `My Courses (${enrolled.length})` : `Browse (${availableCourses.length})`}
          </button>
        ))}
      </div>

      {tab === 'enrolled' ? (
        enrolled.length === 0 ? (
          <div className="glassmorphism p-12 rounded-2xl text-center">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">You haven&apos;t enrolled in any courses yet</p>
            <button onClick={() => setTab('browse')}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >Browse Courses</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolled.map((course, idx) => (
              <motion.div
                key={course.course_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glassmorphism p-6 rounded-2xl border border-slate-700/50 flex flex-col"
              >
                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{course.course_title}</h2>
                <p className="text-slate-500 text-sm mb-4">{course.subject}</p>

                <div className="mt-auto">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-cyan-400 font-medium">{Math.round(course.progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                      className="h-full bg-cyan-500 rounded-full" />
                  </div>
                  <button 
                    onClick={() => router.push('/dashboard/student/quizzes')}
                    className="w-full mt-5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" /> Continue
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        availableCourses.length === 0 ? (
          <div className="glassmorphism p-12 rounded-2xl text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-slate-400">You&apos;re enrolled in all available courses!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glassmorphism p-6 rounded-2xl border border-slate-700/50 flex flex-col"
              >
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{course.title}</h2>
                <p className="text-slate-500 text-sm mb-2">{course.subject}</p>
                {course.description && (
                  <p className="text-slate-600 text-xs mb-4 line-clamp-2">{course.description}</p>
                )}
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrolling === course.id}
                  className="mt-auto w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {enrolling === course.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Plus className="w-4 h-4" /> Enroll</>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

