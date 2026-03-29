import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { currentYearMonth } from '../utils/dates';

interface AppState {
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (year: number, month: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const { year, month } = currentYearMonth();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedYear: year,
      selectedMonth: month,
      setSelectedMonth: (year, month) => set({ selectedYear: year, selectedMonth: month }),
      darkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const next = !state.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        }),
    }),
    {
      name: 'app-preferences',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
