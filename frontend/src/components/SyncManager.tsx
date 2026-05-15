'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export function SyncManager() {
  useOfflineSync();
  const isOffline = useAppStore(state => state.isOffline);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 bg-amber-500/10 border border-amber-500/30 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg"
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-amber-400 font-semibold text-sm">You are offline</h4>
            <p className="text-amber-400/70 text-xs">Data will sync when connection is restored</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
