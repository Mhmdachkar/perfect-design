import i18n from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/format";

function t(key: string, params?: Record<string, string>) {
  return i18n.t(`activityLabels.${key}`, params ?? {});
}

function statusLabel(status: string) {
  return i18n.t(`statuses.${status}`, { defaultValue: status.replace(/_/g, " ") });
}

function named(name: string | null | undefined) {
  return name ? `"${name}"` : "";
}

export function activityLabel(entry: {
  action: string;
  entity_type: string;
  entity_name?: string | null;
  new_values?: Record<string, unknown> | null;
  prev_values?: Record<string, unknown> | null;
}): string {
  const name = named(entry.entity_name);
  const a = entry.action;
  const nv = entry.new_values ?? {};
  const pv = entry.prev_values ?? {};

  if (a === "clients.created") return t("clientsCreated", { name });
  if (a === "clients.updated") return t("clientsUpdated", { name });
  if (a === "clients.soft_deleted") return t("clientsSoftDeleted", { name });
  if (a === "clients.restored") return t("clientsRestored", { name });
  if (a === "clients.deleted") return t("clientsDeleted", { name });

  if (a === "workshops.created") return t("workshopsCreated", { name });
  if (a === "workshops.updated") {
    if (pv.workflow_status !== nv.workflow_status) {
      return t("workshopsStatusChanged", { name, status: statusLabel(String(nv.workflow_status)) });
    }
    if (pv.price !== nv.price) {
      return t("workshopsPriceUpdated", {
        name,
        amount: formatMoney(Number(nv.price), String(nv.currency ?? "USD")),
      });
    }
    if (pv.deadline !== nv.deadline) {
      return t("workshopsDeadlineChanged", { name, date: formatDate(String(nv.deadline)) });
    }
    return t("workshopsUpdated", { name });
  }
  if (a === "workshops.soft_deleted") return t("workshopsSoftDeleted", { name });
  if (a === "workshops.restored") return t("workshopsRestored", { name });
  if (a === "workshops.deleted") return t("workshopsDeleted", { name });

  if (a === "payments.created") {
    const amt = nv.amount != null ? formatMoney(Number(nv.amount), String(nv.currency ?? "USD")) : "";
    return amt ? t("paymentsCreatedAmount", { amount: amt }) : t("paymentsCreated");
  }
  if (a === "payments.updated") {
    if (pv.amount !== nv.amount) {
      return t("paymentsUpdatedAmount", {
        oldAmount: formatMoney(Number(pv.amount), String(pv.currency ?? "USD")),
        newAmount: formatMoney(Number(nv.amount), String(nv.currency ?? "USD")),
      });
    }
    return t("paymentsUpdated");
  }
  if (a === "payments.soft_deleted") return t("paymentsSoftDeleted");
  if (a === "payments.restored") return t("paymentsRestored");
  if (a === "payments.deleted") return t("paymentsDeleted");

  if (a === "expenses.created") return t("expensesCreated", { name });
  if (a === "expenses.updated") return t("expensesUpdated", { name });
  if (a === "expenses.soft_deleted") return t("expensesSoftDeleted", { name });
  if (a === "expenses.restored") return t("expensesRestored", { name });
  if (a === "expenses.deleted") return t("expensesDeleted", { name });

  if (a === "notes.created") return t("notesCreated");
  if (a === "notes.updated") return t("notesUpdated");
  if (a === "notes.soft_deleted") return t("notesSoftDeleted");
  if (a === "notes.restored") return t("notesRestored");
  if (a === "notes.deleted") return t("notesDeleted");
  if (a === "documents.created") return t("documentsCreated", { name });
  if (a === "documents.soft_deleted") return t("documentsSoftDeleted", { name });
  if (a === "documents.restored") return t("documentsRestored", { name });
  if (a === "documents.deleted") return t("documentsDeleted", { name });
  if (a === "document.downloaded") return t("documentDownloaded", { name });

  if (a === "workshop_tags.created") return t("tagsCreated", { name });
  if (a === "workshop_tags.deleted") return t("tagsDeleted", { name });
  if (a === "workshop.tag_assigned") return t("tagAssigned", { name });
  if (a === "workshop.tag_removed") return t("tagRemoved", { name });

  if (a === "workshop.invoice_printed") return t("invoicePrinted", { name });
  if (a === "reports.snapshot_generated") return t("reportsSnapshot");
  if (a === "reports.exported") return t("reportsExported");

  if (a === "app_settings.updated") return t("settingsUpdated");
  if (a === "exchange_rates.created") return t("ratesCreated", { name });
  if (a === "exchange_rates.deleted") return t("ratesDeleted", { name });

  if (a === "auth.signed_in") return t("authSignedIn");
  if (a === "auth.signed_out") return t("authSignedOut");
  if (a === "dashboard.layout_updated") return t("dashboardLayoutUpdated");

  return t("generic", {
    entity: entry.entity_type.replace(/_/g, " "),
    action: a.split(".").pop()?.replace(/_/g, " ") ?? "changed",
  });
}

export function groupActivityByDate<T extends { created_at: string }>(
  items: T[],
): { date: string; label: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const d = item.created_at.slice(0, 10);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(item);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupItems]) => ({
      date,
      label: formatDate(date),
      items: groupItems,
    }));
}
