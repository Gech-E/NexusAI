'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
}

function Shimmer({ className = '' }: SkeletonProps) {
  return (
    <div className={`relative overflow-hidden bg-slate-800/50 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
    </div>
  );
}

/** Full-page skeleton matching dashboard card layout */
export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Shimmer className="h-8 w-64" />
        <Shimmer className="h-4 w-96" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glassmorphism p-6 rounded-2xl flex items-start gap-4">
            <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Shimmer className="h-4 w-20" />
              <Shimmer className="h-7 w-16" />
              <Shimmer className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="glassmorphism rounded-2xl p-6">
            <div className="space-y-2 mb-6">
              <Shimmer className="h-5 w-40" />
              <Shimmer className="h-3 w-56" />
            </div>
            <Shimmer className="h-60 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card-level skeleton */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="glassmorphism p-6 rounded-2xl space-y-4"
        >
          <Shimmer className="w-12 h-12 rounded-xl" />
          <Shimmer className="h-5 w-3/4" />
          <Shimmer className="h-4 w-1/2" />
          <Shimmer className="h-10 w-full rounded-xl" />
        </motion.div>
      ))}
    </div>
  );
}

/** Row-level skeleton */
export function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
          <Shimmer className="w-12 h-12 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Shimmer className="h-5 w-48" />
            <Shimmer className="h-3 w-32" />
          </div>
          <Shimmer className="h-9 w-24 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}
