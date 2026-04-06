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
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const generalNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksjoner' },
  { to: '/budget', icon: PiggyBank, label: 'Budsjett' },
  { to: '/bills', icon: FileText, label: 'Regninger' },
  { to: '/subscriptions', icon: Repeat, label: 'Abonnementer' },
  { to: '/income', icon: TrendingUp, label: 'Inntekter' },
  { to: '/investments', icon: BarChart3, label: 'Investeringer' },
  { to: '/goals', icon: Target, label: 'Mål' },
  { to: '/reports', icon: LineChart, label: 'Rapporter' },
];

const otherNav = [
  { to: '/accounts', icon: Wallet, label: 'Kontoer' },
  { to: '/debt', icon: CreditCard, label: 'Gjeld' },
  { to: '/settings', icon: Settings, label: 'Innstillinger' },
];

function NavSection({ items }: { items: typeof generalNav }) {
  return (
    <>
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900'
                : 'text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : '')} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[hsl(var(--sidebar))] border-r border-gray-100 dark:border-gray-800 min-h-screen shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">kr</span>
          </div>
          <div>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">FinansApp</p>
            <p className="text-[10px] text-gray-400 leading-tight">Personlig økonomi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {/* General Preferences */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Generelt
          </p>
          <div className="space-y-0.5">
            <NavSection items={generalNav} />
          </div>
        </div>

        {/* Other Preferences */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Andre valg
          </p>
          <div className="space-y-0.5">
            <NavSection items={otherNav} />
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-150">
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Hjelp og støtte</span>
            </button>
          </div>
        </div>
      </div>

      {/* User section */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">B</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">Bruker</p>
            <p className="text-xs text-gray-400 truncate">Privat økonomi</p>
          </div>
          <button className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shrink-0">
            <LogOut className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </aside>
  );
}
