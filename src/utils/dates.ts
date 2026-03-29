import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isWithinInterval,
  addDays,
  differenceInDays,
  parseISO,
  isValid,
} from 'date-fns';
import { nb } from 'date-fns/locale';

export { nb };

/** Format dato som "15. mars 2026" */
export function formatDate(date: Date): string {
  return format(date, "d. MMMM yyyy", { locale: nb });
}

/** Format dato kort: "15. mar" */
export function formatDateShort(date: Date): string {
  return format(date, "d. MMM", { locale: nb });
}

/** Format dato som "2026-03-15" (ISO) */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Format månedsnavn: "Mars 2026" */
export function formatMonth(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy', { locale: nb }).replace(/^\w/, c => c.toUpperCase());
}

/** Format kort månedsnavn: "mar" */
export function formatMonthShort(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMM', { locale: nb });
}

/** Gjeldende år og måned */
export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Start og slutt av en gitt måned */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/** Neste måned */
export function nextMonth(year: number, month: number): { year: number; month: number } {
  const date = addMonths(new Date(year, month - 1, 1), 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Forrige måned */
export function prevMonth(year: number, month: number): { year: number; month: number } {
  const date = subMonths(new Date(year, month - 1, 1), 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** Antall dager til en dato (negativt = forfalt) */
export function daysUntil(date: Date): number {
  return differenceInDays(date, new Date());
}

/** Er dato innen N dager? */
export function isDueWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const future = addDays(now, days);
  return isWithinInterval(date, { start: now, end: future });
}

/** Er dato forfalt (før i dag)? */
export function isOverdue(date: Date): boolean {
  return date < new Date();
}

/** Parse dato fra string trygt */
export function parseDateSafe(str: string): Date | null {
  try {
    const d = parseISO(str);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

/** Alle måneder i et år som liste */
export function monthsInYear(year: number): { year: number; month: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    year,
    month: i + 1,
    label: formatMonth(year, i + 1),
  }));
}
