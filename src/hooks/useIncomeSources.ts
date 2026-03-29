import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { IncomeSource } from '../db/schema';

export function useIncomeSources() {
  return useLiveQuery(() => db.incomeSources.orderBy('name').toArray()) ?? [];
}

export function useActiveIncomeSources() {
  return useLiveQuery(() =>
    db.incomeSources.where('isActive').equals(1).sortBy('name')
  ) ?? [];
}

export async function createIncomeSource(data: Omit<IncomeSource, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.incomeSources.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateIncomeSource(id: number, data: Partial<IncomeSource>) {
  return db.incomeSources.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteIncomeSource(id: number) {
  return db.incomeSources.delete(id);
}
