'use client';

import { create } from 'zustand';
import type { Admin } from '@/lib/types';

type CurrentAdmin = Omit<Admin, 'password_hash' | 'updated_at'>;

interface AuthState {
  admin: CurrentAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAdmin: (admin: CurrentAdmin | null) => void;
  clearAuth: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  setAdmin: (admin) => set({ admin, isAuthenticated: !!admin, isLoading: false }),

  clearAuth: () => set({ admin: null, isAuthenticated: false, isLoading: false }),

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Unauthorized');
      const { data } = await res.json();
      set({ admin: data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
