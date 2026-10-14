/** Big counts (coins, XP, tasks done) with the language's digit grouping: 1,234,567 or 1 234 567. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
