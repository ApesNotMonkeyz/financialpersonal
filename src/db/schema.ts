// ─── TypeScript-typer for alle 11 databaseentiteter ───────────────────────────

export type AccountType =
  | 'checking'
  | 'savings'
  | 'cash'
  | 'credit'
  | 'investment'
  | 'loan';

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  currency: string; // 'NOK'
  balance: number; // øre (heltall)
  institution: string;
  notes: string;
  isActive: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id?: number;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isDefault: boolean;
  parentId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id?: number;
  accountId: number;
  categoryId: number;
  amount: number; // øre, alltid positivt
  date: Date;
  description: string;
  type: TransactionType;
  notes: string;
  tags: string[];
  isRecurring: boolean;
  recurringBillId?: number;
  recurringSubscriptionId?: number;
  linkedTransferId?: number;
  isReconciled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BudgetPeriod = 'monthly' | 'yearly';

export interface Budget {
  id?: number;
  categoryId: number;
  amount: number; // øre
  period: BudgetPeriod;
  year: number;
  month?: number; // 1-12, kun for monthly
  rollover: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BillFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'once';
export type BillStatus = 'active' | 'paused' | 'cancelled';

export interface Bill {
  id?: number;
  name: string;
  categoryId: number;
  amount: number; // øre
  currency: string;
  frequency: BillFrequency;
  dueDay: number; // 1-31
  nextDueDate: Date;
  provider: string;
  accountId?: number;
  autopay: boolean;
  status: BillStatus;
  notes: string;
  color: string;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionBillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trial' | 'paused' | 'cancelled';

export interface Subscription {
  id?: number;
  name: string;
  categoryId: number;
  amount: number; // øre
  currency: string;
  billingCycle: SubscriptionBillingCycle;
  nextBillingDate: Date;
  trialEndDate?: Date;
  provider: string;
  accountId?: number;
  status: SubscriptionStatus;
  websiteUrl: string;
  notes: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IncomeType =
  | 'salary'
  | 'freelance'
  | 'passive'
  | 'investment'
  | 'other';
export type IncomeFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'irregular';

export interface IncomeSource {
  id?: number;
  name: string;
  type: IncomeType;
  amount: number; // øre, forventet beløp
  frequency: IncomeFrequency;
  accountId: number;
  isActive: boolean;
  taxRate?: number; // prosent 0-100
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InvestmentType =
  | 'stock'
  | 'fund'
  | 'etf'
  | 'crypto'
  | 'savings_account'
  | 'bonds'
  | 'other';

export interface Investment {
  id?: number;
  name: string;
  type: InvestmentType;
  accountId: number;
  ticker?: string;
  quantity: number;
  purchasePrice: number; // øre per enhet
  currentPrice: number; // øre per enhet
  purchaseDate: Date;
  institution: string;
  currency: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DebtType =
  | 'mortgage'
  | 'car_loan'
  | 'student_loan'
  | 'credit_card'
  | 'personal_loan'
  | 'other';
export type DebtStatus = 'active' | 'paid_off';

export interface Debt {
  id?: number;
  name: string;
  type: DebtType;
  accountId?: number;
  originalAmount: number; // øre
  currentBalance: number; // øre
  interestRate: number; // APR i prosent
  minimumPayment: number; // øre per måned
  paymentDueDay: number; // 1-31
  startDate: Date;
  projectedPayoffDate?: Date;
  institution: string;
  notes: string;
  status: DebtStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtPayment {
  id?: number;
  debtId: number;
  transactionId?: number;
  amount: number; // øre
  date: Date;
  principal: number; // øre
  interest: number; // øre
  notes: string;
  createdAt: Date;
}

export type GoalType = 'savings' | 'debt_payoff' | 'investment' | 'other';

export interface Goal {
  id?: number;
  name: string;
  type: GoalType;
  targetAmount: number; // øre
  currentAmount: number; // øre
  targetDate?: Date;
  accountId?: number;
  notes: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetWorthSnapshot {
  id?: number;
  date: Date;
  totalAssets: number; // øre
  totalLiabilities: number; // øre
  netWorth: number; // øre
}
