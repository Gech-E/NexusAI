'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiUrl } from '@/lib/api';

export const useOfflineSync = () => {
  const setOfflineStatus = useAppStore((state) => state.setOfflineStatus);
  const accessToken = useAppStore((state) => state.accessToken);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 System online. Starting sync...');
      setOfflineStatus(false);
      
      // In a real PWA, we would read from IndexedDB (using idb or similar)
      // and flush the pending request queue.
      const offlineQueue = JSON.parse(localStorage.getItem('nexus-offline-queue') || '[]');
      
      if (offlineQueue.length > 0 && accessToken) {
        try {
          const response = await fetch(apiUrl('/api/v1/sync/bulk'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              collection: 'quiz_attempts',
              data: offlineQueue,
            }),
          });

          if (response.ok) {
            console.log('✅ Sync completed successfully.');
            localStorage.removeItem('nexus-offline-queue');
          }
        } catch (error) {
          console.error('❌ Sync failed:', error);
        }
      }
    };

    const handleOffline = () => {
      console.log('📡 System offline. Switching to local storage.');
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setOfflineStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, accessToken]);
};
