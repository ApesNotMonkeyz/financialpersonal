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
  if (data.amount <= 0) throw new Error('Beløp må være større enn 0');

  const now = new Date();
  return db.transaction('rw', db.transactions, db.accounts, async () => {
    const id = await db.transactions.add({ ...data, createdAt: now, updatedAt: now });

    const account = await db.accounts.get(data.accountId);
    if (account) {
      let delta = 0;
      if (data.type === 'income') delta = data.amount;
      else if (data.type === 'expense') delta = -data.amount;
      // transfer: behandles separat med linkedTransferId

      if (delta !== 0) {
        await db.accounts.update(data.accountId, {
          balance: account.balance + delta,
          updatedAt: now,
        });
      }
    }

    return id;
  });
}

export async function updateTransaction(id: number, data: Partial<Transaction>) {
  return db.transactions.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteTransaction(id: number) {
  const tx = await db.transactions.get(id);
  if (!tx) return;

  return db.transaction('rw', db.transactions, db.accounts, async () => {
    await db.transactions.delete(id);

    const account = await db.accounts.get(tx.accountId);
    if (account) {
      let delta = 0;
      if (tx.type === 'income') delta = -tx.amount;
      else if (tx.type === 'expense') delta = tx.amount;

      if (delta !== 0) {
        await db.accounts.update(tx.accountId, {
          balance: account.balance + delta,
          updatedAt: new Date(),
        });
      }
    }
  });
}
