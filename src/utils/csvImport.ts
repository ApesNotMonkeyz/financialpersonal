export interface CsvTransaction {
  date: Date;
  description: string;
  amount: number; // øre (positive = inntekt, negative = utgift)
}

export type BankFormat = 'dnb' | 'nordea' | 'sbanken' | 'unknown';

export interface ParseResult {
  format: BankFormat;
  transactions: CsvTransaction[];
  errors: string[];
}

// ---------- CSV parsing helpers ----------

function parseCsvLine(line: string, delimiter = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/** "01.01.2024" → Date */
function parseNorwegianDate(str: string): Date | null {
  const cleaned = str.replace(/"/g, '').trim();
  // dd.mm.yyyy
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]);
    const y = parseInt(match[3]);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  // yyyy-mm-dd
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

/** "1 234,56" or "-1.234,56" → øre */
function parseNorwegianAmount(str: string): number | null {
  if (!str || str.trim() === '') return null;
  // Remove quotes, spaces (thousands sep), replace comma with dot
  const cleaned = str
    .replace(/"/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // remove dot thousands separator
    .replace(',', '.')
    .trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

// ---------- Bank format detection ----------

export function detectBankFormat(headerLine: string): BankFormat {
  const h = headerLine.toLowerCase();
  if (h.includes('forklaringstekst') && h.includes('rentedato')) return 'dnb';
  if (h.includes('bokf') && h.includes('ringsdato')) return 'nordea';
  if (h.includes('inn p') && h.includes('konto')) return 'sbanken';
  if (h.includes('skandiabanken') || h.includes('sbanken')) return 'sbanken';
  return 'unknown';
}

// ---------- Bank-specific parsers ----------

/**
 * DNB CSV format:
 * "Dato";"Forklaringstekst";"Rentedato";"Beløp";"Saldo"
 * "01.01.2024";"VARE KJØP 123";"01.01.2024";"-1 234,56";"12 345,67"
 */
function parseDnb(lines: string[]): { transactions: CsvTransaction[]; errors: string[] } {
  const transactions: CsvTransaction[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 4) { errors.push(`Linje ${i + 1}: for få kolonner`); continue; }
    const date = parseNorwegianDate(cols[0]);
    const description = cols[1];
    const amount = parseNorwegianAmount(cols[3]);
    if (!date) { errors.push(`Linje ${i + 1}: ugyldig dato "${cols[0]}"`); continue; }
    if (amount === null) { errors.push(`Linje ${i + 1}: ugyldig beløp "${cols[3]}"`); continue; }
    transactions.push({ date, description, amount });
  }
  return { transactions, errors };
}

/**
 * Nordea CSV format:
 * Bokføringsdato;Beløp;Avsender;Mottaker;Navn;Tittel;Valuta;Saldo
 * 01.01.2024;-1234,56;SENDER;RECEIVER;NAME;TITLE;NOK;12345,67
 */
function parseNordea(lines: string[]): { transactions: CsvTransaction[]; errors: string[] } {
  const transactions: CsvTransaction[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 6) { errors.push(`Linje ${i + 1}: for få kolonner`); continue; }
    const date = parseNorwegianDate(cols[0]);
    const amount = parseNorwegianAmount(cols[1]);
    // Use Tittel (col 5) or Navn (col 4) as description
    const description = (cols[5] || cols[4] || cols[2] || '').trim();
    if (!date) { errors.push(`Linje ${i + 1}: ugyldig dato "${cols[0]}"`); continue; }
    if (amount === null) { errors.push(`Linje ${i + 1}: ugyldig beløp "${cols[1]}"`); continue; }
    transactions.push({ date, description, amount });
  }
  return { transactions, errors };
}

/**
 * Sbanken / Skandiabanken CSV format:
 * "Dato";"Inn på konto";"Ut fra konto";"Til konto";"Fra konto";"Beskrivelse";"Arkivreferanse";"Type";"Saldo"
 * "01.01.2024";"";"1 234,56";"ACC";"ACC";"Kjøp mat";"REF";"Varer/tjenester";"12 345,67"
 */
function parseSbanken(lines: string[]): { transactions: CsvTransaction[]; errors: string[] } {
  const transactions: CsvTransaction[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 6) { errors.push(`Linje ${i + 1}: for få kolonner`); continue; }
    const date = parseNorwegianDate(cols[0]);
    const innRaw = cols[1];
    const utRaw = cols[2];
    const description = cols[5] || '';
    if (!date) { errors.push(`Linje ${i + 1}: ugyldig dato "${cols[0]}"`); continue; }
    const innAmount = parseNorwegianAmount(innRaw) ?? 0;
    const utAmount = parseNorwegianAmount(utRaw) ?? 0;
    let amount: number;
    if (innAmount !== 0) amount = innAmount; // income: positive
    else if (utAmount !== 0) amount = -utAmount; // expense: negative
    else { errors.push(`Linje ${i + 1}: ingen beløp funnet`); continue; }
    transactions.push({ date, description, amount });
  }
  return { transactions, errors };
}

// ---------- Main entry point ----------

export function parseCsvFile(text: string): ParseResult {
  // Normalize line endings
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = rawLines.filter(l => l.trim());
  if (lines.length === 0) return { format: 'unknown', transactions: [], errors: ['Filen er tom'] };

  const format = detectBankFormat(lines[0]);
  let parsed: { transactions: CsvTransaction[]; errors: string[] };

  if (format === 'dnb') parsed = parseDnb(lines);
  else if (format === 'nordea') parsed = parseNordea(lines);
  else if (format === 'sbanken') parsed = parseSbanken(lines);
  else {
    return {
      format: 'unknown',
      transactions: [],
      errors: [
        'Ukjent bankformat. Støttede banker: DNB, Nordea, Sbanken/Skandiabanken.',
        `Første linje: ${lines[0]}`,
      ],
    };
  }

  return { format, ...parsed };
}

export const BANK_FORMAT_LABELS: Record<BankFormat, string> = {
  dnb: 'DNB',
  nordea: 'Nordea',
  sbanken: 'Sbanken / Skandiabanken',
  unknown: 'Ukjent',
};

/** Enkel duplikatsjekk: samme dato + beskrivelse + beløp */
export function deduplicateTransactions(
  incoming: CsvTransaction[],
  existing: { date: Date; description: string; amount: number }[]
): { unique: CsvTransaction[]; duplicates: CsvTransaction[] } {
  const existingKeys = new Set(
    existing.map(t => `${t.date.toISOString().split('T')[0]}|${t.description}|${Math.abs(t.amount)}`)
  );
  const unique: CsvTransaction[] = [];
  const duplicates: CsvTransaction[] = [];
  for (const tx of incoming) {
    const key = `${tx.date.toISOString().split('T')[0]}|${tx.description}|${Math.abs(tx.amount)}`;
    if (existingKeys.has(key)) duplicates.push(tx);
    else unique.push(tx);
  }
  return { unique, duplicates };
}
