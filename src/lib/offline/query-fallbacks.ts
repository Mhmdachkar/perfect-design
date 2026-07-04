import type { QueryKey } from "@tanstack/react-query";
import { DEFAULT_CURRENCY } from "@/lib/currency";

function keyRoot(queryKey: QueryKey): string {
  const root = queryKey[0];
  return typeof root === "string" ? root : "";
}

export function getOfflineQueryFallback<T = unknown>(queryKey: QueryKey): T {
  const root = keyRoot(queryKey);

  switch (root) {
    case "clients":
    case "clients-lite":
      return [] as T;
    case "client": {
      const id = String(queryKey[1] ?? "");
      return {
        client: {
          id,
          full_name: "",
          phone: null,
          whatsapp: null,
          notes: null,
          created_at: new Date().toISOString(),
        },
        workshops: [],
        payments: [],
        expenses: [],
        notes: [],
        activity: [],
        baseCurrency: DEFAULT_CURRENCY,
      } as T;
    }
    case "workshops":
      return {
        workshops: [],
        baseCurrency: DEFAULT_CURRENCY,
      } as T;
    case "workshop": {
      const id = String(queryKey[1] ?? "");
      return {
        w: {
          id,
          name: "",
          client_id: "",
          workflow_status: "planning",
          financial_status: "pending",
          priority: "medium",
          currency: DEFAULT_CURRENCY,
          price: 0,
          discount: 0,
          clients: { id: "", full_name: "", company: null },
        },
        fin: null,
        payments: [],
        notes: [],
        activity: [],
        tagIds: [],
      } as T;
    }
    case "payments":
    case "payments-all":
      return { payments: [], baseCurrency: DEFAULT_CURRENCY } as T;
    case "expenses":
      return { expenses: [], baseCurrency: DEFAULT_CURRENCY } as T;
    case "dashboard":
      return {
        kpis: {
          total_clients: 0,
          total_workshops: 0,
          open_workshops: 0,
          completed_workshops: 0,
          total_revenue: 0,
          total_received: 0,
          outstanding: 0,
          today_received: 0,
          month_received: 0,
          month_expenses: 0,
          total_expenses: 0,
          profit: 0,
          overdue_invoices: 0,
          collection_rate: 0,
          avg_payment_delay_days: 0,
        },
        settings: { base_currency: DEFAULT_CURRENCY, business_name: null, dashboard_layout: null },
        upcoming: [],
        latestPayments: [],
        latestExpenses: [],
        monthly: [],
      } as T;
    case "settings":
      return { settings: null, rates: [] } as T;
    case "calendar-workshops":
      return [] as T;
    case "activity":
      return [] as T;
    case "recycle":
      return {
        clients: [],
        workshops: [],
        payments: [],
        expenses: [],
        notes: [],
        documents: [],
      } as T;
    case "reports":
      return {
        payments: [],
        expenses: [],
        workshops: [],
        baseCurrency: DEFAULT_CURRENCY,
      } as T;
    case "documents":
      return [] as T;
    case "workshop-tags":
      return [] as T;
    case "exchange-rate":
      return null as T;
    default:
      return [] as T;
  }
}
