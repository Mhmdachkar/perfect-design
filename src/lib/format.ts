export function formatMoney(n: number | null | undefined, currency = "USD") {
  const v = Number(n ?? 0);
  if (currency === "LBP") {
    return `${Math.round(v).toLocaleString("en-US")} LBP`;
  }
  return v.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: 2 });
}

export function formatCompact(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1000) {
    return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function resolveLocale(locale?: string) {
  return locale === "ar" ? "ar-LB" : "en-US";
}

export function formatDate(d: string | Date | null | undefined, locale?: string) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(resolveLocale(locale), { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: string | Date | null | undefined, locale?: string) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(resolveLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Full timestamp for admin audit views. */
export function formatDateTimeFull(d: string | Date | null | undefined, locale?: string) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString(resolveLocale(locale), {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatMoneyLocalized(
  n: number | null | undefined,
  currency = "USD",
  locale?: string,
) {
  const v = Number(n ?? 0);
  const loc = resolveLocale(locale);
  if (currency === "LBP") {
    return `${Math.round(v).toLocaleString(loc)} ل.ل`;
  }
  return v.toLocaleString(loc, { style: "currency", currency, maximumFractionDigits: 2 });
}

export function relativeTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function initialsOf(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join("");
}
