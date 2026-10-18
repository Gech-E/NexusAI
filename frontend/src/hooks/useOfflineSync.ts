'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { apiPost } from '@/lib/api';

interface SyncRecord {
  entity_type: string;
  entity_id: string;
  operation: 'create' | 'update' | 'upsert';
  data: Record<string, unknown>;
}

const QUEUE_KEY = 'nexus-offline-queue';

function readQueue(): SyncRecord[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((record): record is SyncRecord =>
      record !== null && typeof record === 'object' &&
      typeof record.entity_type === 'string' &&
      typeof record.entity_id === 'string' &&
      ['create', 'update', 'upsert'].includes(record.operation) &&
      record.data !== null && typeof record.data === 'object' &&
      !Array.isArray(record.data)
    );
  } catch {
    return [];
  }
}

function getDeviceId(): string {
  const key = 'nexus-device-id';
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}

export const useOfflineSync = () => {
  const setOfflineStatus = useAppStore((state) => state.setOfflineStatus);
  const accessToken = useAppStore((state) => state.accessToken);

  useEffect(() => {
    let synchronizing = false;

    const flush = async () => {
      setOfflineStatus(!navigator.onLine);
      if (!navigator.onLine || !accessToken || synchronizing) return;
      synchronizing = true;
      try {
        // Snapshot the queue and only remove records that were acknowledged.
        // Legacy malformed records remain in storage for manual recovery.
        const records = readQueue();
        if (!records.length) return;
        const batch = records.slice(0, 100);
        const response = await apiPost<{ status: string; errors: unknown[] }>(
          '/api/v1/sync/bulk',
          { device_id: getDeviceId(), records: batch }
        );
        if (response.status === 'success' && response.errors.length === 0) {
          const current = readQueue();
          const batchJson = batch.map((r) => JSON.stringify(r));
          const remaining = [...current];
          for (const item of batchJson) {
            const index = remaining.findIndex((r) => JSON.stringify(r) === item);
            if (index !== -1) remaining.splice(index, 1);
          }
          localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
        }
      } catch (error) {
        console.error('Offline sync will retry when connectivity returns:', error);
      } finally {
        synchronizing = false;
      }
    };

    const onOffline = () => setOfflineStatus(true);
    window.addEventListener('online', flush);
    window.addEventListener('offline', onOffline);
    void flush();
    return () => {
      window.removeEventListener('online', flush);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOfflineStatus, accessToken]);
};
