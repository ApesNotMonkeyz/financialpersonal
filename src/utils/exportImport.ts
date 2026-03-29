import { db } from '../db';

export async function exportAllData(): Promise<void> {
  const [accounts, categories, transactions, budgets, bills, subscriptions, incomeSources, investments, debts, debtPayments, goals] =
    await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.bills.toArray(),
      db.subscriptions.toArray(),
      db.incomeSources.toArray(),
      db.investments.toArray(),
      db.debts.toArray(),
      db.debtPayments.toArray(),
      db.goals.toArray(),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    accounts, categories, transactions, budgets, bills, subscriptions,
    incomeSources, investments, debts, debtPayments, goals,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finans-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json);

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(t => t.clear()));

    if (data.categories?.length) await db.categories.bulkAdd(parseDates(data.categories));
    if (data.accounts?.length) await db.accounts.bulkAdd(parseDates(data.accounts));
    if (data.transactions?.length) await db.transactions.bulkAdd(parseDates(data.transactions));
    if (data.budgets?.length) await db.budgets.bulkAdd(parseDates(data.budgets));
    if (data.bills?.length) await db.bills.bulkAdd(parseDates(data.bills));
    if (data.subscriptions?.length) await db.subscriptions.bulkAdd(parseDates(data.subscriptions));
    if (data.incomeSources?.length) await db.incomeSources.bulkAdd(parseDates(data.incomeSources));
    if (data.investments?.length) await db.investments.bulkAdd(parseDates(data.investments));
    if (data.debts?.length) await db.debts.bulkAdd(parseDates(data.debts));
    if (data.debtPayments?.length) await db.debtPayments.bulkAdd(parseDates(data.debtPayments));
    if (data.goals?.length) await db.goals.bulkAdd(parseDates(data.goals));
  });
}

// Rekursivt konverter ISO-datostrenger tilbake til Date-objekter
function parseDates<T>(items: T[]): T[] {
  return items.map(item => {
    const obj = { ...item } as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        obj[key] = new Date(val);
      }
    }
    return obj as T;
  });
}
