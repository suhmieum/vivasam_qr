import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Teacher } from '../types';

interface AppState {
  teacher: Teacher | null;
  setTeacher: (teacher: Teacher | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      teacher: null,
      setTeacher: (teacher) => set({ teacher }),
      logout: () => set({ teacher: null }),
    }),
    {
      name: 'student-feedback-storage',
    }
  )
);
