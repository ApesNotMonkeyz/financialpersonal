import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Goal } from '../db/schema';

export function useGoals() {
  return useLiveQuery(() => db.goals.orderBy('name').toArray()) ?? [];
}

export function useActiveGoals() {
  return useLiveQuery(() => db.goals.where('isActive').equals(1).sortBy('name')) ?? [];
}

export async function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.goals.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateGoal(id: number, data: Partial<Goal>) {
  return db.goals.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteGoal(id: number) {
  return db.goals.delete(id);
}
