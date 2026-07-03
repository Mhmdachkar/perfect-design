export type FilterState = Record<string, string>;

export function applyTextFilter<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((f) => String(item[f] ?? "").toLowerCase().includes(q)),
  );
}

export function applyFilterState<T extends Record<string, unknown>>(
  items: T[],
  filters: FilterState,
): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value || value === "all") return true;
      return String(item[key] ?? "") === value;
    }),
  );
}
