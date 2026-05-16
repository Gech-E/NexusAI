'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow Zustand to hydrate from localStorage
    const timer = setTimeout(() => {
      const store = useAppStore.getState();
      if (!store.accessToken || !store.user) {
        router.replace('/login');
      } else {
        setIsChecking(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router, pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-500 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
