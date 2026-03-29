import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Budget } from '../db/schema';
import { monthRange } from '../utils/dates';

export function useBudgetsByMonth(year: number, month: number): Budget[] {
  return useLiveQuery(
    (): Promise<Budget[]> => db.budgets.filter(b => b.year === year && b.month === month).toArray(),
    [year, month]
  ) ?? ([] as Budget[]);
}

export function useMonthlySpending(year: number, month: number) {
  return useLiveQuery(async () => {
    const { start, end } = monthRange(year, month);
    const transactions = await db.transactions
      .where('date')
      .between(start, end, true, true)
      .filter(t => t.type === 'expense')
      .toArray();

    const byCategory: Record<number, number> = {};
    for (const tx of transactions) {
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
    }
    return byCategory;
  }, [year, month]) ?? {};
}

export async function upsertBudget(data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  const existing = await db.budgets
    .filter(b => b.categoryId === data.categoryId && b.year === data.year && b.month === data.month)
    .first();

  if (existing?.id) {
    return db.budgets.update(existing.id, { ...data, updatedAt: now });
  }
  return db.budgets.add({ ...data, createdAt: now, updatedAt: now });
}

export async function deleteBudget(id: number) {
  return db.budgets.delete(id);
}
