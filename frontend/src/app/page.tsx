'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, BrainCircuit, ShieldAlert, WifiOff, BarChart3,
  GraduationCap, Zap, Globe, CheckCircle2, Menu, X,
  ChevronRight, Star, Users, BookOpen
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Local AI Tutor',
    description: 'Quantized LLMs run directly on the device, providing personalized tutoring without requiring an active internet connection.',
    icon: BrainCircuit,
    color: 'cyan',
  },
  {
    title: 'Offline Sync Engine',
    description: 'Seamlessly works offline and automatically synchronizes progress, grades, and analytics when connectivity is restored.',
    icon: WifiOff,
    color: 'emerald',
  },
  {
    title: 'AI Exam Monitoring',
    description: 'High-performance C++ engine uses computer vision to detect suspicious behavior and maintain academic integrity.',
    icon: ShieldAlert,
    color: 'purple',
  },
  {
    title: 'Adaptive Assessments',
    description: 'Quizzes that adjust difficulty in real-time based on student performance, ensuring optimal challenge levels.',
    icon: Zap,
    color: 'amber',
  },
  {
    title: 'Smart Analytics',
    description: 'AI-powered dashboards for students, teachers, and admins with actionable insights and predictive performance models.',
    icon: BarChart3,
    color: 'blue',
  },
  {
    title: 'Multi-Institution',
    description: 'Built for scale — manage multiple schools, departments, and thousands of students from a single platform.',
    icon: Globe,
    color: 'rose',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
};

const steps = [
  {
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up as a student, teacher, or admin. Set up your institution in minutes.',
    icon: GraduationCap,
  },
  {
    step: '02',
    title: 'Start Learning',
    description: 'Enroll in courses, take adaptive quizzes, and chat with the AI tutor — even offline.',
    icon: BookOpen,
  },
  {
    step: '03',
    title: 'Track & Improve',
    description: 'AI-powered analytics show your progress, weak areas, and personalized recommendations.',
    icon: BarChart3,
  },
];

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Courses' },
  { value: '99.8%', label: 'AI Uptime' },
  { value: '50+', label: 'Institutions' },
];

const testimonials = [
  {
    quote: 'Nexus LearnAI transformed how we teach. The offline capability means no student is left behind, regardless of connectivity.',
    name: 'Dr. Sarah Mbeki',
    role: 'Principal, Lagos Academy',
    rating: 5,
  },
  {
    quote: 'The AI tutor feels like having a personal teacher available 24/7. My exam scores improved by 35% in just one semester.',
    name: 'James Ochieng',
    role: 'Student, Nairobi University',
    rating: 5,
  },
  {
    quote: 'The analytics dashboard gives me insights I never had before. I can identify struggling students weeks before they fail.',
    name: 'Prof. Amara Diallo',
    role: 'Teacher, Dakar Institute',
    rating: 5,
  },
];

const footerLinks = {
  Product: ['Features', 'Pricing', 'AI Tutor', 'Analytics', 'Offline Mode'],
  Company: ['About Us', 'Careers', 'Blog', 'Press Kit', 'Contact'],
  Resources: ['Documentation', 'API Reference', 'Community', 'Help Center', 'Status'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Data Processing'],
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* ─── Navigation ────────────────────────────────────────────── */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight text-white">Nexus<span className="text-cyan-400">LearnAI</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#testimonials" className="hover:text-white transition-colors">Testimonials</Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white hover:text-cyan-400 transition-colors">Log in</Link>
          <Link href="/register" className="text-sm font-medium bg-white text-slate-950 px-4 py-2 rounded-full hover:bg-cyan-50 transition-colors">Get Started</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[280px] bg-slate-950 border-l border-slate-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-lg font-bold text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-4 text-slate-300 font-medium">
              <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">How It Works</Link>
              <Link href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-white transition-colors">Testimonials</Link>
              <hr className="border-slate-800" />
              <Link href="/login" className="py-2 hover:text-white transition-colors">Log in</Link>
              <Link href="/register" className="bg-cyan-500 text-slate-950 font-semibold py-3 px-4 rounded-xl text-center hover:bg-cyan-400 transition-colors">
                Get Started
              </Link>
            </nav>
          </motion.div>
        </motion.div>
      )}

      {/* ─── Hero Section ──────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 pt-16 md:pt-20 pb-20 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-cyan-300 text-xs font-medium mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          Offline-First AI Learning Platform
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mb-6 leading-tight"
        >
          Empowering Education <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
            Anywhere, Anytime.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-xl text-slate-400 max-w-2xl mb-10"
        >
          The smart learning ecosystem designed for schools in low-connectivity regions. Featuring offline AI tutors, computer vision exam monitoring, and advanced analytics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-full transition-all border border-slate-700 hover:border-slate-600 text-center">
            Explore Features
          </Link>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 mt-20 w-full max-w-3xl"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ─── Features Section ──────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-32 relative">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Learn Smarter</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Built from the ground up for education in challenging environments. Every feature works offline and syncs automatically.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const c = colorMap[feature.color];
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="glassmorphism p-6 rounded-2xl hover:border-slate-600 transition-all group"
                >
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4 border ${c.border} group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${c.text}`} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-32 relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-emerald-400 text-sm font-semibold tracking-wider uppercase mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Get started in three simple steps. No complex setup required.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative text-center"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
                  <step.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-xs font-bold text-cyan-400 mb-2 tracking-widest">STEP {step.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.description}</p>

                {/* Arrow connector (hidden on mobile) */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 translate-x-1/2">
                    <ChevronRight className="w-6 h-6 text-slate-700" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ──────────────────────────────────────────── */}
      <section id="testimonials" className="py-20 md:py-32 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-purple-400 text-sm font-semibold tracking-wider uppercase mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Trusted by Educators <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Worldwide</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glassmorphism p-6 rounded-2xl"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ───────────────────────────────────────────── */}
      <section className="py-20 md:py-32 relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glassmorphism rounded-3xl p-10 md:p-16 text-center bg-gradient-to-br from-cyan-900/20 to-emerald-900/20 border-cyan-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Transform Education?
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8 text-lg">
                Join thousands of students and educators already using Nexus LearnAI. Start your free trial today — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-full transition-all border border-slate-700 text-center"
                >
                  Sign In
                </Link>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free 14-day trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5 hidden sm:flex"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full offline access</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-16 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <BrainCircuit className="w-7 h-7 text-cyan-400" />
                <span className="text-lg font-bold text-white">Nexus<span className="text-cyan-400">AI</span></span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                AI-powered offline-first education platform built for the next billion learners.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <span className="text-slate-500 text-sm hover:text-slate-300 transition-colors cursor-pointer">{link}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">&copy; {new Date().getFullYear()} Nexus LearnAI. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-slate-600">
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
