import Dexie, { type EntityTable } from 'dexie';
import type {
  Account,
  Category,
  Transaction,
  Budget,
  Bill,
  Subscription,
  IncomeSource,
  Investment,
  Debt,
  DebtPayment,
  Goal,
  NetWorthSnapshot,
} from './schema';

class FinanceDatabase extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  bills!: EntityTable<Bill, 'id'>;
  subscriptions!: EntityTable<Subscription, 'id'>;
  incomeSources!: EntityTable<IncomeSource, 'id'>;
  investments!: EntityTable<Investment, 'id'>;
  debts!: EntityTable<Debt, 'id'>;
  debtPayments!: EntityTable<DebtPayment, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  netWorthSnapshots!: EntityTable<NetWorthSnapshot, 'id'>;

  constructor() {
    super('PersonligOkonomiDB');

    this.version(1).stores({
      accounts: '++id, name, type, isActive',
      categories: '++id, name, type, parentId',
      transactions:
        '++id, accountId, categoryId, date, type, recurringBillId, recurringSubscriptionId',
      budgets: '++id, categoryId, year, month',
      bills: '++id, name, status, nextDueDate, categoryId',
      subscriptions: '++id, name, status, nextBillingDate, categoryId',
      incomeSources: '++id, name, type, isActive, accountId',
      investments: '++id, name, type, accountId',
      debts: '++id, name, type, status',
      debtPayments: '++id, debtId, date',
      goals: '++id, name, isActive',
      netWorthSnapshots: '++id, date',
    });
  }
}

export const db = new FinanceDatabase();
