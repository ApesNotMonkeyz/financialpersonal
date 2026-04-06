import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Account } from '../db/schema';

export function useAccounts(): Account[] {
  return useLiveQuery((): Promise<Account[]> => db.accounts.orderBy('name').toArray()) ?? ([] as Account[]);
}

export function useActiveAccounts(): Account[] {
  return useLiveQuery((): Promise<Account[]> => db.accounts.where('isActive').equals(1).sortBy('name')) ?? ([] as Account[]);
}

export async function createAccount(data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.accounts.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateAccount(id: number, data: Partial<Account>) {
  return db.accounts.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteAccount(id: number) {
  // Kaskadesletting: fjern alle tilknyttede data
  return db.transaction('rw',
    [db.accounts, db.transactions, db.bills, db.subscriptions, db.incomeSources, db.investments, db.debts],
    async () => {
      await db.transactions.where('accountId').equals(id).delete();
      await db.bills.where('accountId').equals(id).modify({ accountId: undefined });
      await db.subscriptions.where('accountId').equals(id).modify({ accountId: undefined });
      await db.incomeSources.where('accountId').equals(id).delete();
      await db.investments.where('accountId').equals(id).delete();
      await db.debts.where('accountId').equals(id).modify({ accountId: undefined });
      await db.accounts.delete(id);
    }
  );
}
