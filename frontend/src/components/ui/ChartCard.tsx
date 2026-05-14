'use client';

import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  action?: React.ReactNode;
}

export function ChartCard({ title, subtitle, children, className = '', delay = 0, action }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glassmorphism rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}
