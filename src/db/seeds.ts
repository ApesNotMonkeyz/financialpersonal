import { db } from './index';
import type { Category } from './schema';

const defaultCategories: Omit<Category, 'id'>[] = [
  // Utgifter
  { name: 'Mat og dagligvarer', type: 'expense', color: '#22c55e', icon: '🛒', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Restaurant og takeaway', type: 'expense', color: '#16a34a', icon: '🍽️', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Bolig og husleie', type: 'expense', color: '#3b82f6', icon: '🏠', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Strøm og energi', type: 'expense', color: '#f59e0b', icon: '⚡', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Transport', type: 'expense', color: '#8b5cf6', icon: '🚗', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Kollektivtransport', type: 'expense', color: '#7c3aed', icon: '🚌', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Helse og legebesøk', type: 'expense', color: '#ef4444', icon: '💊', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Treningssenter og sport', type: 'expense', color: '#f97316', icon: '🏋️', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Klær og sko', type: 'expense', color: '#ec4899', icon: '👗', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Underholdning', type: 'expense', color: '#14b8a6', icon: '🎬', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Abonnementer', type: 'expense', color: '#06b6d4', icon: '📱', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Reise og ferie', type: 'expense', color: '#84cc16', icon: '✈️', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Utdanning og kurs', type: 'expense', color: '#6366f1', icon: '📚', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Barn og familie', type: 'expense', color: '#f43f5e', icon: '👨‍👩‍👧', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Husdyr', type: 'expense', color: '#a78bfa', icon: '🐾', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Gaver og donasjoner', type: 'expense', color: '#fb923c', icon: '🎁', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Forsikring', type: 'expense', color: '#64748b', icon: '🛡️', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Bank og gebyrer', type: 'expense', color: '#475569', icon: '🏦', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Sparing', type: 'expense', color: '#0ea5e9', icon: '💰', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Diverse utgifter', type: 'expense', color: '#94a3b8', icon: '📦', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  // Inntekter
  { name: 'Lønn', type: 'income', color: '#22c55e', icon: '💼', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Freelance og konsulentarbeid', type: 'income', color: '#16a34a', icon: '💻', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Passiv inntekt', type: 'income', color: '#84cc16', icon: '📈', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Utbytte og renter', type: 'income', color: '#ca8a04', icon: '💹', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Salg', type: 'income', color: '#0d9488', icon: '🏷️', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Støtte og bidrag', type: 'income', color: '#7c3aed', icon: '🤝', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
  { name: 'Diverse inntekter', type: 'income', color: '#94a3b8', icon: '📥', isDefault: true, createdAt: new Date(), updatedAt: new Date() },
];

export async function seedDatabase() {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkAdd(defaultCategories);
  }
}
