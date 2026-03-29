import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { StatCard } from '../../components/shared/StatCard';
import { TransactionForm } from '../../components/forms/TransactionForm';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useRecentTransactions, createTransaction } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import { useBudgetsByMonth, useMonthlySpending } from '../../hooks/useBudgets';
import { useAppStore } from '../../stores/useAppStore';
import { db } from '../../db';
import { formatNOK, formatNOKCompact, formatPercent } from '../../utils/currency';
import { formatDate, formatMonthShort, daysUntil, isOverdue } from '../../utils/dates';
import { budgetProgress } from '../../utils/calculations';
import type { Transaction } from '../../db/schema';

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

  const categoryMap = Object.fromEntries(categories.map(c => [c.id!, c]));
  const accountMap = Object.fromEntries(accounts.map(a => [a.id!, a]));
  // 6-måneder trenddata
  const trendData = useLiveQuery(async () => {
    const results = [];
    for (let i = 5; i >= 0; i--) {
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
  }) ?? [];

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createTransaction(data);
    setTxOpen(false);
  };

  if (!stats) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Laster...</div>;
  }

  // Top budsjett-kategorier med data
  const topBudgetCategories = budgets
    .map(b => ({
      budget: b,
      category: categoryMap[b.categoryId],
      spent: spending[b.categoryId] ?? 0,
      pct: budgetProgress(spending[b.categoryId] ?? 0, b.amount),
    }))
    .filter(item => item.category)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <Button onClick={() => { setTxAmount(0); setTxOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Transaksjon
        </Button>
      </div>

      {/* Nettoverdi-banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Nettoverdi</p>
              <p className="text-3xl font-bold mt-1">{formatNOK(stats.netWorth)}</p>
              <p className="text-blue-200 text-xs mt-1">
                Eiendeler {formatNOKCompact(stats.totalAssets)} · Gjeld {formatNOKCompact(stats.totalLiabilities)}
              </p>
            </div>
            <Wallet className="h-10 w-10 text-blue-300" />
          </div>
        </CardContent>
      </Card>

      {/* Månedsoversikt */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Inntekter"
          value={formatNOKCompact(stats.income)}
          subtitle={stats.prevIncome > 0 ? formatPercent(((stats.income - stats.prevIncome) / stats.prevIncome) * 100) + ' vs forrige' : undefined}
          icon={TrendingUp}
          iconColor="bg-green-50 dark:bg-green-900/20"
          valueColor="text-green-700 dark:text-green-400"
          trend={stats.income >= stats.prevIncome ? 'up' : 'down'}
        />
        <StatCard
          title="Utgifter"
          value={formatNOKCompact(stats.expenses)}
          subtitle={stats.prevExpenses > 0 ? formatPercent(((stats.expenses - stats.prevExpenses) / stats.prevExpenses) * 100) + ' vs forrige' : undefined}
          icon={TrendingDown}
          iconColor="bg-red-50 dark:bg-red-900/20"
          valueColor="text-red-600 dark:text-red-400"
          trend={stats.expenses <= stats.prevExpenses ? 'up' : 'down'}
        />
        <StatCard
          title="Spareevne"
          value={formatNOKCompact(stats.savings)}
          subtitle={stats.income > 0 ? `${Math.round((stats.savings / stats.income) * 100)} % av inntekt` : undefined}
          icon={BarChart3}
          valueColor={stats.savings >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6-månedstrend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siste 6 måneder</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {trendData.every(d => d.inntekter === 0 && d.utgifter === 0) ? (
              <p className="text-center text-gray-400 text-sm py-8">Ingen data ennå</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => formatNOKCompact(v * 100)} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatNOK((v as number) * 100)} />
                  <Bar dataKey="inntekter" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="utgifter" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Kommende regninger */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Kommende regninger (30 dager)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.upcomingBills.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Ingen regninger de neste 30 dagene</p>
            ) : (
              <div className="space-y-2">
                {stats.upcomingBills.slice(0, 5).map(bill => {
                  const days = daysUntil(bill.nextDueDate);
                  const overdue = isOverdue(bill.nextDueDate);
                  return (
                    <div key={bill.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{bill.name}</p>
                        <p className={`text-xs ${overdue ? 'text-red-500' : days <= 3 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {overdue ? 'Forfalt!' : days === 0 ? 'I dag' : `Om ${days} dager`}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">{formatNOK(bill.amount)}</span>
                    </div>
                  );
                })}
                {stats.upcomingBills.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-1">+{stats.upcomingBills.length - 5} til</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budsjettfremgang */}
      {topBudgetCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budsjett denne måneden</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {topBudgetCategories.map(({ budget, category, spent, pct }) => (
              <div key={budget.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>{category?.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{category?.name}</span>
                  </span>
                  <span className="text-gray-500">
                    {formatNOKCompact(spent)} / {formatNOKCompact(budget.amount)}
                    {' '}
                    <Badge
                      variant={pct > 100 ? 'destructive' : pct > 80 ? 'warning' : 'success'}
                      className="ml-1 text-xs"
                    >
                      {pct} %
                    </Badge>
                  </span>
                </div>
                <Progress
                  value={Math.min(100, pct)}
                  className="h-2"
                  indicatorClassName={pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Siste transaksjoner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Siste transaksjoner</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Ingen transaksjoner ennå</p>
          ) : (
            <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {recentTransactions.map(tx => {
                const cat = categoryMap[tx.categoryId];
                const acc = accountMap[tx.accountId];
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: (cat?.color ?? '#94a3b8') + '20' }}
                    >
                      {cat?.icon ?? '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.date)} · {acc?.name}</p>
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatNOK(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
