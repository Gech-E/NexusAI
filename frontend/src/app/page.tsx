'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, ShieldAlert, WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020617]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight text-white">Nexus<span className="text-cyan-400">LearnAI</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#solutions" className="hover:text-white transition-colors">Solutions</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white hover:text-cyan-400 transition-colors">Log in</Link>
          <Link href="/register" className="text-sm font-medium bg-white text-slate-950 px-4 py-2 rounded-full hover:bg-cyan-50 transition-colors">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center relative z-10 pt-20 pb-32">
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
          className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mb-6 leading-tight"
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
          className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10"
        >
          The smart learning ecosystem designed for schools in low-connectivity regions. Featuring offline AI tutors, computer vision exam monitoring, and advanced analytics.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center"
        >
          <button className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-full transition-all flex items-center justify-center gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-full transition-all border border-slate-700 hover:border-slate-600">
            Book a Demo
          </button>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-5xl text-left"
        >
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/20">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Local AI Tutor</h3>
            <p className="text-slate-400 text-sm">Quantized LLMs run directly on the device, providing personalized tutoring without requiring an active internet connection.</p>
          </div>
          
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20">
              <WifiOff className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Offline Sync Engine</h3>
            <p className="text-slate-400 text-sm">Seamlessly works offline and automatically synchronizes progress, grades, and analytics when connectivity is restored.</p>
          </div>

          <div className="glassmorphism p-6 rounded-2xl">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 border border-purple-500/20">
              <ShieldAlert className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">AI Exam Monitoring</h3>
            <p className="text-slate-400 text-sm">High-performance C++ engine uses computer vision to detect suspicious behavior and maintain academic integrity.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
