/** Local `datetime-local` value: YYYY-MM-DDTHH:mm:ss (seconds included). */
export function nowDateTimeLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Parse `datetime-local` or ISO string to ISO for Supabase timestamptz. */
export function toTimestampIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Map DB timestamptz to `datetime-local` input value in local timezone. */
export function toDateTimeLocalValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function localDatePart(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isSameLocalDay(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined = new Date(),
): boolean {
  const da = localDatePart(a);
  const db = localDatePart(b);
  return !!da && !!db && da === db;
}

/** Auto reference: PD-YYYYMMDD-HHMMSS */
export function defaultPaymentReference(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `PD-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
