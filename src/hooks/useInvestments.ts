import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Investment } from '../db/schema';

export function useInvestments() {
  return useLiveQuery(() => db.investments.orderBy('name').toArray()) ?? [];
}

export function useInvestmentStats() {
  return useLiveQuery(async () => {
    const investments = await db.investments.toArray();
    const totalValue = investments.reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);
    const totalCost = investments.reduce((sum, i) => sum + i.purchasePrice * i.quantity, 0);
    const gainLoss = totalValue - totalCost;
    const gainLossPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    return { totalValue, totalCost, gainLoss, gainLossPct, count: investments.length };
  }) ?? { totalValue: 0, totalCost: 0, gainLoss: 0, gainLossPct: 0, count: 0 };
}

export async function createInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.investments.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateInvestment(id: number, data: Partial<Investment>) {
  return db.investments.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteInvestment(id: number) {
  return db.investments.delete(id);
}
