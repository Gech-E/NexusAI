'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';

export function SyncManager() {
  useOfflineSync();
  return null;
}
