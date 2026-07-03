import type { QueryClient } from "@tanstack/react-query";

export type AppDataScope =
  | "dashboard"
  | "clients"
  | "workshops"
  | "payments"
  | "expenses"
  | "reports"
  | "search"
  | "notifications"
  | "activity"
  | "calendar"
  | "recycle";

const SCOPE_KEYS: Record<AppDataScope, readonly (readonly string[])[]> = {
  dashboard: [["dashboard"]],
  clients: [["clients"], ["clients-lite"], ["client"]],
  workshops: [["workshops"], ["workshop"]],
  payments: [["payments-all"], ["payments"]],
  expenses: [["expenses"]],
  reports: [["reports"]],
  search: [["command-search"]],
  notifications: [["notifications"]],
  activity: [["activity"]],
  calendar: [["calendar-workshops"]],
  recycle: [["recycle"]],
};

/** Invalidate cached queries so dashboard and list pages stay in sync after mutations. */
export function invalidateAppData(qc: QueryClient, scopes: AppDataScope[]) {
  const seen = new Set<string>();
  for (const scope of scopes) {
    for (const key of SCOPE_KEYS[scope]) {
      const id = key.join("\0");
      if (seen.has(id)) continue;
      seen.add(id);
      qc.invalidateQueries({ queryKey: [...key] });
    }
  }
}

export function invalidateAfterClientChange(qc: QueryClient) {
  invalidateAppData(qc, ["clients", "dashboard", "search", "activity"]);
}

export function invalidateAfterWorkshopChange(qc: QueryClient) {
  invalidateAppData(qc, ["workshops", "clients", "dashboard", "reports", "search", "notifications", "activity", "calendar"]);
}

export function invalidateAfterPaymentChange(qc: QueryClient) {
  invalidateAppData(qc, ["payments", "workshops", "clients", "dashboard", "reports", "notifications", "activity"]);
}

export function invalidateAfterExpenseChange(qc: QueryClient) {
  invalidateAppData(qc, ["expenses", "clients", "dashboard", "reports", "activity"]);
}

export function invalidateAfterSettingsChange(qc: QueryClient) {
  invalidateAppData(qc, ["dashboard", "workshops", "clients", "reports", "payments", "expenses", "activity"]);
}

export function invalidateAfterActivityChange(qc: QueryClient) {
  invalidateAppData(qc, ["activity"]);
}

/** Refresh entity detail timeline + global activity after notes/documents change. */
export function invalidateAfterEntityTimelineChange(
  qc: QueryClient,
  entityType: string,
  entityId: string,
) {
  invalidateAfterActivityChange(qc);
  if (entityType === "client") {
    qc.invalidateQueries({ queryKey: ["client", entityId] });
  } else if (entityType === "workshop") {
    qc.invalidateQueries({ queryKey: ["workshop", entityId] });
    invalidateAppData(qc, ["workshops"]);
  }
}

export function invalidateAfterRecycleChange(qc: QueryClient) {
  invalidateAppData(qc, [
    "recycle",
    "activity",
    "dashboard",
    "clients",
    "workshops",
    "payments",
    "expenses",
    "reports",
    "search",
    "notifications",
  ]);
}
