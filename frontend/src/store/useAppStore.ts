import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  firstName?: string; // Derived or kept for compatibility
  role?: string;
}

interface AppState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isOffline: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setOfflineStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isOffline: false,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      setOfflineStatus: (status) => set({ isOffline: status }),
    }),
    {
      name: 'nexus-auth-storage',
    }
  )
);
