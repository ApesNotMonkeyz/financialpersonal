import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Debt, DebtPayment } from '../db/schema';

export function useDebts(status?: Debt['status']) {
  return useLiveQuery(async () => {
    if (status) {
      return db.debts.where('status').equals(status).sortBy('name');
    }
    return db.debts.orderBy('name').toArray();
  }, [status]) ?? [];
}

export function useDebtStats() {
  return useLiveQuery(async () => {
    const active = await db.debts.where('status').equals('active').toArray();
    const totalBalance = active.reduce((sum, d) => sum + d.currentBalance, 0);
    const totalMinPayment = active.reduce((sum, d) => sum + d.minimumPayment, 0);
    return { totalBalance, totalMinPayment, count: active.length };
  }) ?? { totalBalance: 0, totalMinPayment: 0, count: 0 };
}

export function useDebtPayments(debtId: number) {
  return useLiveQuery(
    () => db.debtPayments.where('debtId').equals(debtId).reverse().sortBy('date'),
    [debtId]
  ) ?? [];
}

export async function createDebt(data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.debts.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateDebt(id: number, data: Partial<Debt>) {
  return db.debts.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteDebt(id: number) {
  return db.debts.delete(id);
}

export async function logDebtPayment(
  debtId: number,
  amount: number,
  principal: number,
  interest: number,
  accountId: number,
  categoryId: number
) {
  const now = new Date();
  const debt = await db.debts.get(debtId);
  if (!debt) return;

  // Logg transaksjon
  const txId = await db.transactions.add({
    accountId,
    categoryId,
    amount,
    date: now,
    description: `Avdrag – ${debt.name}`,
    type: 'expense',
    notes: '',
    tags: ['gjeld', 'avdrag'],
    isRecurring: false,
    isReconciled: false,
    createdAt: now,
    updatedAt: now,
  });

  // Logg betalingsdetaljer
  const paymentData: Omit<DebtPayment, 'id'> = {
    debtId,
    transactionId: txId as number,
    amount,
    date: now,
    principal,
    interest,
    notes: '',
    createdAt: now,
  };
  await db.debtPayments.add(paymentData);

  // Reduser gjeldssaldo
  const newBalance = Math.max(0, debt.currentBalance - principal);
  await db.debts.update(debtId, {
    currentBalance: newBalance,
    status: newBalance === 0 ? 'paid_off' : 'active',
    updatedAt: now,
  });

  // Oppdater kontosaldo
  const account = await db.accounts.get(accountId);
  if (account) {
    await db.accounts.update(accountId, {
      balance: account.balance - amount,
      updatedAt: now,
    });
  }
}
