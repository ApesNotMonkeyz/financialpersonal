import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  FileText,
  Repeat,
  TrendingUp,
  BarChart3,
  CreditCard,
  Wallet,
  Target,
  LineChart,
  Settings,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksjoner' },
  { to: '/budget', icon: PiggyBank, label: 'Budsjett' },
  { to: '/bills', icon: FileText, label: 'Regninger' },
  { to: '/subscriptions', icon: Repeat, label: 'Abonnementer' },
  { to: '/income', icon: TrendingUp, label: 'Inntekter' },
  { to: '/investments', icon: BarChart3, label: 'Investeringer' },
  { to: '/debt', icon: CreditCard, label: 'Gjeld' },
  { to: '/accounts', icon: Wallet, label: 'Kontoer' },
  { to: '/goals', icon: Target, label: 'Mål' },
  { to: '/reports', icon: LineChart, label: 'Rapporter' },
  { to: '/settings', icon: Settings, label: 'Innstillinger' },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-screen">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">kr</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">MinØkonomi</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Personlig finans</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
