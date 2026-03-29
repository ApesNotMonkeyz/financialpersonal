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
  return db.categories.delete(id);
}
