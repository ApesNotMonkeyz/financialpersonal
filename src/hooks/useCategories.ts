import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category, CategoryType } from '../db/schema';

export function useCategories(type?: CategoryType): Category[] {
  return useLiveQuery(async (): Promise<Category[]> => {
    if (type) {
      return db.categories.where('type').equals(type).sortBy('name');
    }
    return db.categories.orderBy('name').toArray();
  }, [type]) ?? ([] as Category[]);
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date();
  return db.categories.add({ ...data, createdAt: now, updatedAt: now });
}

export async function updateCategory(id: number, data: Partial<Category>) {
  return db.categories.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteCategory(id: number) {
  // Nullstill kategorireferanser på tilknyttede poster i stedet for å slette dem
  return db.transaction('rw', [db.categories, db.transactions, db.budgets, db.bills, db.subscriptions], async () => {
    const uncategorized = await db.categories.where('name').equals('Diverse utgifter').first();
    const fallbackId = uncategorized?.id ?? 0;
    if (fallbackId) {
      await db.transactions.where('categoryId').equals(id).modify({ categoryId: fallbackId });
      await db.bills.where('categoryId').equals(id).modify({ categoryId: fallbackId });
      await db.subscriptions.where('categoryId').equals(id).modify({ categoryId: fallbackId });
    }
    await db.budgets.where('categoryId').equals(id).delete();
    await db.categories.delete(id);
  });
}
