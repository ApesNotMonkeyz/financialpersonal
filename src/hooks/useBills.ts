import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Bill } from '../db/schema';
import { addDays, addMonths, addWeeks, addQuarters, addYears } from 'date-fns';

export function useBills(status?: Bill['status']): Bill[] {
  return useLiveQuery(async (): Promise<Bill[]> => {
    if (status) {
      return db.bills.where('status').equals(status).sortBy('nextDueDate');
    }
    return db.bills.orderBy('nextDueDate').toArray();
  }, [status]) ?? ([] as Bill[]);
}

export function useUpcomingBills(days = 30): Bill[] {
  return useLiveQuery(async (): Promise<Bill[]> => {
    const future = addDays(new Date(), days);
    const bills = await db.bills.where('status').equals('active').toArray();
    return bills
      .filter((b: Bill) => b.nextDueDate <= future)
      .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }, [days]) ?? ([] as Bill[]);
}

export async function createBill(data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.bills.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateBill(id: number, data: Partial<Bill>) {
  return db.bills.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteBill(id: number) {
  return db.bills.delete(id);
}

export function getNextDueDate(bill: Bill): Date {
  const current = bill.nextDueDate;
  switch (bill.frequency) {
    case 'weekly': return addWeeks(current, 1);
    case 'monthly': return addMonths(current, 1);
    case 'quarterly': return addQuarters(current, 1);
    case 'yearly': return addYears(current, 1);
    default: return current;
  }
}

export async function markBillAsPaid(billId: number, accountId: number) {
  const bill = await db.bills.get(billId);
  if (!bill) return;

  // Opprett transaksjon
  const now = new Date();
  await db.transactions.add({
    accountId,
    categoryId: bill.categoryId,
    amount: bill.amount,
    date: now,
    description: `${bill.name} – regning betalt`,
    type: 'expense',
    notes: '',
    tags: ['regning'],
    isRecurring: true,
    recurringBillId: billId,
    isReconciled: false,
    createdAt: now,
    updatedAt: now,
  });

  // Oppdater kontosaldo
  const account = await db.accounts.get(accountId);
  if (account) {
    await db.accounts.update(accountId, {
      balance: account.balance - bill.amount,
      updatedAt: now,
    });
  }

  // Flytt neste forfallsdato fremover
  const nextDue = getNextDueDate(bill);
  await db.bills.update(billId, { nextDueDate: nextDue, updatedAt: now });
}
