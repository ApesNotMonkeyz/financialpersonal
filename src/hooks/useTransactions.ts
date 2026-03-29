import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../db/schema';
import { monthRange } from '../utils/dates';

export function useTransactionsByMonth(year: number, month: number): Transaction[] {
  return useLiveQuery(async (): Promise<Transaction[]> => {
    const { start, end } = monthRange(year, month);
    const transactions = await db.transactions
      .where('date')
      .between(start, end, true, true)
      .reverse()
      .sortBy('date');
    return transactions.reverse();
  }, [year, month]) ?? ([] as Transaction[]);
}

export function useRecentTransactions(limit = 10): Transaction[] {
  return useLiveQuery((): Promise<Transaction[]> =>
    db.transactions.orderBy('date').reverse().limit(limit).toArray()
  ) ?? ([] as Transaction[]);
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  const id = await db.transactions.add({ ...data, createdAt: now, updatedAt: now });

  // Oppdater kontosaldo
  const account = await db.accounts.get(data.accountId);
  if (account) {
    const delta = data.type === 'income' ? data.amount : -data.amount;
    await db.accounts.update(data.accountId, {
      balance: account.balance + delta,
      updatedAt: now,
    });
  }

  return id;
}

export async function updateTransaction(id: number, data: Partial<Transaction>) {
  return db.transactions.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteTransaction(id: number) {
  const tx = await db.transactions.get(id);
  if (!tx) return;

  await db.transactions.delete(id);

  // Reverser kontosaldoendring
  const account = await db.accounts.get(tx.accountId);
  if (account) {
    const delta = tx.type === 'income' ? -tx.amount : tx.amount;
    await db.accounts.update(tx.accountId, {
      balance: account.balance + delta,
      updatedAt: new Date(),
    });
  }
}
