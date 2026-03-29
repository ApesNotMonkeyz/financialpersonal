import type { Debt } from '../db/schema';

/** Beregn gjenstående saldo etter én betaling */
export function calculateNextBalance(
  balance: number,
  annualInterestRate: number,
  payment: number
): number {
  const monthlyRate = annualInterestRate / 100 / 12;
  const interest = Math.round(balance * monthlyRate);
  const principal = payment - interest;
  return Math.max(0, balance - principal);
}

/** Beregn månedlig rente i øre */
export function calculateMonthlyInterest(
  balance: number,
  annualInterestRate: number
): number {
  const monthlyRate = annualInterestRate / 100 / 12;
  return Math.round(balance * monthlyRate);
}

/** Beregn antall måneder til nedbetalt */
export function calculatePayoffMonths(
  balance: number,
  annualInterestRate: number,
  monthlyPayment: number
): number | null {
  if (monthlyPayment <= 0) return null;
  const monthlyRate = annualInterestRate / 100 / 12;

  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }

  const monthlyInterest = balance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) return null; // Vil aldri bli nedbetalt

  const months = Math.log(monthlyPayment / (monthlyPayment - monthlyInterest)) / Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

/** Beregn total rente over lånets levetid */
export function calculateTotalInterest(
  balance: number,
  annualInterestRate: number,
  monthlyPayment: number
): number {
  const months = calculatePayoffMonths(balance, annualInterestRate, monthlyPayment);
  if (months === null) return Infinity;
  return Math.max(0, monthlyPayment * months - balance);
}

/** Sorter gjeld etter avalanche-metoden (høyest rente først) */
export function sortDebtAvalanche(debts: Debt[]): Debt[] {
  return [...debts]
    .filter(d => d.status === 'active')
    .sort((a, b) => b.interestRate - a.interestRate);
}

/** Sorter gjeld etter snowball-metoden (lavest saldo først) */
export function sortDebtSnowball(debts: Debt[]): Debt[] {
  return [...debts]
    .filter(d => d.status === 'active')
    .sort((a, b) => a.currentBalance - b.currentBalance);
}

/** Budsjettfremgang i prosent (0-100+) */
export function budgetProgress(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.round((spent / budget) * 100);
}

/** Normalisert månedskostnad for abonnement/regning */
export function toMonthlyCost(amount: number, billingCycle: 'monthly' | 'yearly'): number {
  return billingCycle === 'yearly' ? Math.round(amount / 12) : amount;
}

/** Normalisert årskostnad */
export function toAnnualCost(amount: number, billingCycle: 'monthly' | 'yearly'): number {
  return billingCycle === 'monthly' ? amount * 12 : amount;
}
