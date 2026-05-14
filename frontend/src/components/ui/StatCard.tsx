'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  delay?: number;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-cyan-400',
  iconBg = 'bg-cyan-500/10 border-cyan-500/20',
  trend,
  delay = 0,
  onClick,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={`glassmorphism p-6 rounded-2xl flex items-start gap-4 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-600 hover:scale-[1.02]' : ''
      }`}
    >
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center border shrink-0`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value}
          </p>
        )}
        {subtitle && !trend && (
          <p className="text-slate-500 text-xs mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
