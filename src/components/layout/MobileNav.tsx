import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksjoner' },
  { to: '/budget', icon: PiggyBank, label: 'Budsjett' },
  { to: '/bills', icon: FileText, label: 'Regninger' },
  { to: '/settings', icon: Settings, label: 'Mer' },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[hsl(var(--sidebar))] border-t border-gray-100 dark:border-gray-800 z-40 shadow-lg shadow-gray-200/50 dark:shadow-none">
      <div className="flex items-center justify-around py-2 px-2">
        {mobileNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
