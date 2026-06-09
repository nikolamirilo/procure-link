import { format as formatDate } from "date-fns";
import { srLatn, enUS } from "date-fns/locale";
import type { Locale } from "@/i18n/config";

const dfLocales = { sr: srLatn, en: enUS } as const;
const intlLocales: Record<Locale, string> = { sr: "sr-RS", en: "en-US" };

/**
 * Formats a monetary amount for the given currency and UI locale.
 * RSD is shown without decimals (Serbian convention); EUR with two.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: Locale = "sr"
): string {
  const fractionDigits = currency === "RSD" ? 0 : 2;
  return new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Formats a number using the locale's grouping/decimal conventions. */
export function formatNumber(value: number, locale: Locale = "sr"): string {
  return new Intl.NumberFormat(intlLocales[locale]).format(value);
}

/** Locale-aware date formatting via date-fns (default pattern: 1. jan 2026.). */
export function formatDay(
  date: Date | string,
  pattern = "d. MMM yyyy.",
  locale: Locale = "sr"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDate(d, pattern, { locale: dfLocales[locale] });
}
