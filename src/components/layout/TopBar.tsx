import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppStore } from '../../stores/useAppStore';
import { formatMonth, nextMonth, prevMonth } from '../../utils/dates';

export function TopBar() {
  const { selectedYear, selectedMonth, setSelectedMonth, darkMode, toggleDarkMode } = useAppStore();

  const goNext = () => {
    const { year, month } = nextMonth(selectedYear, selectedMonth);
    setSelectedMonth(year, month);
  };

  const goPrev = () => {
    const { year, month } = prevMonth(selectedYear, selectedMonth);
    setSelectedMonth(year, month);
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={goPrev} aria-label="Forrige måned">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold min-w-[140px] text-center text-gray-900 dark:text-gray-100">
          {formatMonth(selectedYear, selectedMonth)}
        </span>
        <Button variant="ghost" size="icon" onClick={goNext} aria-label="Neste måned">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Bytt fargemodus">
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
