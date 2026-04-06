import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { monthRange, prevMonth } from '../utils/dates';
import { addDays } from 'date-fns';

export function useDashboardStats(year: number, month: number) {
  return useLiveQuery(async () => {
    const { start, end } = monthRange(year, month);
    const prev = prevMonth(year, month);
    const { start: prevStart, end: prevEnd } = monthRange(prev.year, prev.month);

    const [
      transactions,
      prevTransactions,
      accounts,
      investments,
      debts,
    ] = await Promise.all([
      db.transactions.where('date').between(start, end, true, true).toArray(),
      db.transactions.where('date').between(prevStart, prevEnd, true, true).toArray(),
      db.accounts.toArray(),
      db.investments.toArray(),
      db.debts.where('status').equals('active').toArray(),
    ]);

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const totalAssets = accounts
      .filter(a => a.type !== 'credit' && a.type !== 'loan')
      .reduce((s, a) => s + (a.balance ?? 0), 0)
      + investments.reduce((s, i) => s + (i.currentPrice ?? 0) * (i.quantity ?? 0), 0);

    const totalLiabilities = debts.reduce((s, d) => s + d.currentBalance, 0)
      + accounts.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(Math.min(0, a.balance)), 0);

    const netWorth = totalAssets - totalLiabilities;

    // Utgifter per kategori denne måneden
    const byCategory: Record<number, number> = {};
    for (const tx of transactions.filter(t => t.type === 'expense')) {
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
    }

    // Kommende regninger 30 dager frem
    const future30 = addDays(new Date(), 30);
    const upcomingBills = await db.bills
      .where('status').equals('active')
      .and(b => b.nextDueDate <= future30)
      .toArray();
    upcomingBills.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());

    return {
      income,
      expenses,
      savings: income - expenses,
      prevIncome,
      prevExpenses,
      totalAssets,
      totalLiabilities,
      netWorth,
      byCategory,
      upcomingBills,
      transactionCount: transactions.length,
    };
  }, [year, month]);
}
