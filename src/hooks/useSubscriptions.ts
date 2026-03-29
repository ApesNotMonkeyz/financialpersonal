import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Subscription } from '../db/schema';
import { addMonths, addYears } from 'date-fns';
import { toMonthlyCost, toAnnualCost } from '../utils/calculations';

export function useSubscriptions(status?: Subscription['status']) {
  return useLiveQuery(async () => {
    if (status) {
      return db.subscriptions.where('status').equals(status).sortBy('name');
    }
    return db.subscriptions.orderBy('name').toArray();
  }, [status]) ?? [];
}

export function useSubscriptionStats() {
  return useLiveQuery(async () => {
    const active = await db.subscriptions.where('status').equals('active').toArray();
    const monthlyTotal = active.reduce((sum, s) => sum + toMonthlyCost(s.amount, s.billingCycle), 0);
    const annualTotal = active.reduce((sum, s) => sum + toAnnualCost(s.amount, s.billingCycle), 0);
    return { monthlyTotal, annualTotal, count: active.length };
  }) ?? { monthlyTotal: 0, annualTotal: 0, count: 0 };
}

export async function createSubscription(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.subscriptions.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateSubscription(id: number, data: Partial<Subscription>) {
  return db.subscriptions.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteSubscription(id: number) {
  return db.subscriptions.delete(id);
}

export async function markSubscriptionAsPaid(subId: number, accountId: number) {
  const sub = await db.subscriptions.get(subId);
  if (!sub) return;

  const now = new Date();
  await db.transactions.add({
    accountId,
    categoryId: sub.categoryId,
    amount: sub.amount,
    date: now,
    description: `${sub.name} – abonnement`,
    type: 'expense',
    notes: '',
    tags: ['abonnement'],
    isRecurring: true,
    recurringSubscriptionId: subId,
    isReconciled: false,
    createdAt: now,
    updatedAt: now,
  });

  const account = await db.accounts.get(accountId);
  if (account) {
    await db.accounts.update(accountId, { balance: account.balance - sub.amount, updatedAt: now });
  }

  const nextDate = sub.billingCycle === 'monthly'
    ? addMonths(sub.nextBillingDate, 1)
    : addYears(sub.nextBillingDate, 1);
  await db.subscriptions.update(subId, { nextBillingDate: nextDate, updatedAt: now });
}
