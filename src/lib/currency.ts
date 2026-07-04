export const APP_CURRENCIES = ["USD", "LBP"] as const;
export type AppCurrency = (typeof APP_CURRENCIES)[number];
export const DEFAULT_CURRENCY: AppCurrency = "USD";

export type ExchangeRateRow = {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  effective_date: string;
};

/** Map legacy values (e.g. LYD) to supported app currencies. */
export function normalizeCurrency(code: string | null | undefined): AppCurrency {
  return code === "LBP" ? "LBP" : "USD";
}

export function isAppCurrency(code: string | null | undefined): code is AppCurrency {
  return code === "USD" || code === "LBP";
}

export function findLatestUsdToLbpRate(rates: ExchangeRateRow[]): ExchangeRateRow | null {
  return (
    rates.find((r) => r.base_currency === "USD" && r.quote_currency === "LBP") ?? null
  );
}

export function convertCurrency(
  amount: number,
  from: AppCurrency,
  to: AppCurrency,
  usdToLbpRate: number | null | undefined,
): number | null {
  if (!Number.isFinite(amount)) return null;
  if (from === to) return amount;
  const rate = Number(usdToLbpRate);
  if (!rate || rate <= 0) return null;
  if (from === "USD" && to === "LBP") return amount * rate;
  if (from === "LBP" && to === "USD") return amount / rate;
  return null;
}
