import { Search, Bell, MessageSquare, Moon, Sun } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export function TopBar() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <header className="h-16 bg-white dark:bg-[hsl(var(--sidebar))] border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 px-6 shrink-0 shadow-[0_1px_0_0_hsl(220_20%_92%)] dark:shadow-none">
      {/* Welcome text */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
          Velkommen! 👋
        </h2>
        <p className="text-xs text-gray-400 leading-tight">Sjekk din økonomiske oversikt i dag</p>
      </div>

      {/* Search bar */}
      <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Søk..."
          className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none min-w-0"
        />
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-1.5">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* Message icon */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <MessageSquare className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          aria-label="Bytt fargemodus"
        >
          {darkMode
            ? <Sun className="h-4 w-4 text-yellow-500" />
            : <Moon className="h-4 w-4 text-gray-500" />
          }
        </button>
      </div>
    </header>
  );
}
