import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, MoreHorizontal, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { TransactionForm } from '../../components/forms/TransactionForm';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useRecentTransactions, createTransaction } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { useBudgetsByMonth, useMonthlySpending } from '../../hooks/useBudgets';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db';
import { formatNOK, formatNOKCompact } from '../../utils/currency';
import { formatDate, formatMonthShort, daysUntil, isOverdue } from '../../utils/dates';
import { budgetProgress } from '../../utils/calculations';
import type { Transaction } from '../../db/schema';
import { cn } from '../../utils/cn';

// ── Mini stat badge ──
function ChangeBadge({ value, prevValue }: { value: number; prevValue: number }) {
  if (!prevValue) return null;
  const pct = Math.round(((value - prevValue) / prevValue) * 100);
  const positive = pct >= 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
      positive
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    )}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct)} %
    </span>
  );
}

// ── Account card (bank-card style) ──
function AccountCard({ name, balance, type, last4 }: { name: string; balance: number; type: string; last4?: string }) {
  const isCredit = type === 'credit';
  return (
    <div className={cn(
      'relative rounded-2xl p-4 text-white overflow-hidden min-w-[200px]',
      isCredit
        ? 'bg-gradient-to-br from-purple-500 to-purple-700'
        : 'bg-gradient-to-br from-blue-500 to-blue-700'
    )}>
      {/* Background circles */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white/10" />
      {/* Card type */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
          {type === 'credit' ? 'Kreditt' : type === 'savings' ? 'Sparing' : 'Konto'}
        </span>
        <div className="flex gap-1">
          <div className="w-5 h-5 rounded-full bg-white/30" />
          <div className="w-5 h-5 rounded-full bg-white/50" />
        </div>
      </div>
      {/* Number */}
      <p className="text-xs tracking-widest text-white/60 font-mono mb-2">
        •••• •••• •••• {last4 ?? '0000'}
      </p>
      {/* Name */}
      <p className="text-sm font-semibold truncate mb-1">{name}</p>
      {/* Balance */}
      <p className="text-lg font-bold">{formatNOKCompact(Math.abs(balance))}</p>
    </div>
  );
}

// ── Custom tooltip for chart ──
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name === 'inntekter' ? 'Inntekter' : 'Utgifter'}:</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{formatNOK(p.value * 100)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedYear, selectedMonth } = useAppStore();
  const stats = useDashboardStats(selectedYear, selectedMonth);
  const recentTransactions = useRecentTransactions(8);
  const categories = useCategories();
  const accounts = useAccounts();
  const budgets = useBudgetsByMonth(selectedYear, selectedMonth);
  const spending = useMonthlySpending(selectedYear, selectedMonth);

  const [txOpen, setTxOpen] = useState(false);
  const [txAmount, setTxAmount] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<'6M' | '1Y'>('6M');

  const categoryMap = Object.fromEntries(categories.map(c => [c.id!, c]));
  const accountMap = Object.fromEntries(accounts.map(a => [a.id!, a]));

  // Trend data for area chart
  const trendData = useLiveQuery(async () => {
    const months = chartPeriod === '1Y' ? 12 : 6;
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const txs = await db.transactions.where('date').between(start, end, true, true).toArray();
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      results.push({
        month: formatMonthShort(d.getFullYear(), d.getMonth() + 1),
        inntekter: income / 100,
        utgifter: expenses / 100,
      });
    }
    return results;
  }, [chartPeriod]) ?? [];

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTransaction(data);
    setTxOpen(false);
  };

  const topBudgetCategories = budgets
    .map(b => ({
      budget: b,
      category: categoryMap[b.categoryId],
      spent: spending[b.categoryId] ?? 0,
      pct: budgetProgress(spending[b.categoryId] ?? 0, b.amount),
    }))
    .filter(item => item.category)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  const activeAccounts = accounts.filter(a => a.isActive).slice(0, 3);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">Oversikt over din økonomi</p>
        </div>
        <Button
          onClick={() => { setTxAmount(0); setTxOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200 dark:shadow-none"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Ny transaksjon
        </Button>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total saldo */}
        <Card className="rounded-2xl border-0 shadow-sm shadow-blue-100/50 dark:shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total saldo</p>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {formatNOKCompact(stats.netWorth)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xs text-gray-400">
                Eiendeler {formatNOKCompact(stats.totalAssets)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inntekter */}
        <Card className="rounded-2xl border-0 shadow-sm shadow-green-100/50 dark:shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Inntekter</p>
              <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {formatNOKCompact(stats.income)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <ChangeBadge value={stats.income} prevValue={stats.prevIncome} />
              {stats.prevIncome > 0 && <span className="text-xs text-gray-400">vs forrige</span>}
            </div>
          </CardContent>
        </Card>

        {/* Utgifter */}
        <Card className="rounded-2xl border-0 shadow-sm shadow-red-100/50 dark:shadow-none">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Utgifter</p>
              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {formatNOKCompact(stats.expenses)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <ChangeBadge value={stats.expenses} prevValue={stats.prevExpenses} />
              {stats.prevExpenses > 0 && <span className="text-xs text-gray-400">vs forrige</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main content row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart (2/3 width) */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm dark:shadow-none">
          <CardHeader className="pb-0 pt-5 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Portefølje-analyse</CardTitle>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                {(['6M', '1Y'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setChartPeriod(p)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-md transition-all',
                      chartPeriod === p
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3 px-2 pb-4">
            {trendData.every(d => d.inntekter === 0 && d.utgifter === 0) ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-400">
                <p className="text-sm">Ingen transaksjonsdata ennå</p>
                <p className="text-xs mt-1">Legg til transaksjoner for å se grafen</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 92%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => formatNOKCompact(v * 100)} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="inntekter"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#incomeGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#3b82f6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="utgifter"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#ef4444' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-4 px-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">Inntekter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded-full bg-red-400" />
                <span className="text-xs text-gray-500">Utgifter</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts column (1/3 width) */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-sm dark:shadow-none">
            <CardHeader className="pt-4 px-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Dine kontoer</CardTitle>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {activeAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Ingen kontoer ennå</p>
              ) : (
                <div className="space-y-2 overflow-x-auto pb-1">
                  {activeAccounts.map(acc => (
                    <AccountCard
                      key={acc.id}
                      name={acc.name}
                      balance={acc.balance}
                      type={acc.type}
                      last4={String(acc.id).padStart(4, '0')}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spareevne card */}
          <Card className="rounded-2xl border-0 shadow-sm dark:shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Spareevne denne måneden</p>
              <p className={cn(
                'text-xl font-bold',
                stats.savings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              )}>
                {formatNOKCompact(stats.savings)}
              </p>
              {stats.income > 0 && (
                <>
                  <Progress
                    value={Math.max(0, Math.min(100, (stats.savings / stats.income) * 100))}
                    className="h-1.5 mt-2"
                    indicatorClassName={stats.savings >= 0 ? 'bg-green-500' : 'bg-red-500'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {Math.round((stats.savings / stats.income) * 100)} % av inntekt spart
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent transactions (2/3 width) */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm dark:shadow-none">
          <CardHeader className="pt-4 px-5 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Siste transaksjoner</CardTitle>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline">
                Se alle
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-5 pt-3 pb-4">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Ingen transaksjoner ennå</p>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50 dark:divide-gray-800">
                {recentTransactions.map(tx => {
                  const cat = categoryMap[tx.categoryId];
                  const acc = accountMap[tx.accountId];
                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '20' }}
                      >
                        {cat?.icon ?? '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(tx.date)}{acc ? ` · ${acc.name}` : ''}
                        </p>
                      </div>
                      <p className={cn(
                        'text-sm font-bold shrink-0',
                        tx.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-500 dark:text-red-400'
                      )}>
                        {tx.type === 'income' ? '+' : '-'}{formatNOK(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Budgets + Bills */}
        <div className="space-y-4">
          {/* Budget progress */}
          {topBudgetCategories.length > 0 && (
            <Card className="rounded-2xl border-0 shadow-sm dark:shadow-none">
              <CardHeader className="pt-4 px-4 pb-2">
                <CardTitle className="text-sm font-bold">Budsjett</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {topBudgetCategories.map(({ budget, category, spent, pct }) => (
                  <div key={budget.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                        <span>{category?.icon}</span>
                        <span className="truncate max-w-[100px]">{category?.name}</span>
                      </span>
                      <Badge
                        variant={pct > 100 ? 'destructive' : pct > 80 ? 'warning' : 'success'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {pct} %
                      </Badge>
                    </div>
                    <Progress
                      value={Math.min(100, pct)}
                      className="h-1.5"
                      indicatorClassName={pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-blue-500'}
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatNOKCompact(spent)} / {formatNOKCompact(budget.amount)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming bills */}
          <Card className="rounded-2xl border-0 shadow-sm dark:shadow-none">
            <CardHeader className="pt-4 px-4 pb-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
                <CardTitle className="text-sm font-bold">Kommende regninger</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {stats.upcomingBills.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">Ingen regninger de neste 30 dagene</p>
              ) : (
                <div className="space-y-2">
                  {stats.upcomingBills.slice(0, 4).map(bill => {
                    const days = daysUntil(bill.nextDueDate);
                    const overdue = isOverdue(bill.nextDueDate);
                    return (
                      <div key={bill.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{bill.name}</p>
                          <p className={cn(
                            'text-[10px]',
                            overdue ? 'text-red-500' : days <= 3 ? 'text-yellow-600' : 'text-gray-400'
                          )}>
                            {overdue ? 'Forfalt!' : days === 0 ? 'I dag' : `Om ${days} dager`}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {formatNOK(bill.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Add transaction dialog ── */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ny transaksjon</DialogTitle>
          </DialogHeader>
          <TransactionForm
            amount={txAmount}
            onAmountChange={setTxAmount}
            onSubmit={handleAddTransaction}
            onCancel={() => setTxOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
