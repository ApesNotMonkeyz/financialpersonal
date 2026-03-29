// Beløp lagres alltid som øre (heltall). 1 NOK = 100 øre.
// Dette unngår alle float-presisjonsproblemer.

const NOK_FORMATTER = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NOK_COMPACT = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formater øre som "kr 1 234,50" */
export function formatNOK(oere: number): string {
  return NOK_FORMATTER.format(oere / 100);
}

/** Formater øre uten desimaler: "kr 1 234" */
export function formatNOKCompact(oere: number): string {
  return NOK_COMPACT.format(oere / 100);
}

/** Konverter krone-streng fra bruker (f.eks. "1234,50") til øre */
export function parseNOK(input: string): number {
  // Støtt både komma og punktum som desimalskilletegn
  const cleaned = input.replace(/\s/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/** Konverter øre til krone-tall */
export function oereToKroner(oere: number): number {
  return oere / 100;
}

/** Konverter kroner til øre */
export function kronerToOere(kroner: number): number {
  return Math.round(kroner * 100);
}

/** Formater prosentvis endring: "+12,5 %" */
export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals).replace('.', ',')} %`;
}

/** Formater et tall i norsk stil */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('nb-NO').format(value);
}
