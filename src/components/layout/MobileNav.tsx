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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-40">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
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
