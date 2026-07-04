import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { appQueryOptions } from "./app-query";
import { isBrowserOnline } from "./network";

/** Warm the cache for all main pages so they open offline after one online visit. */
export function prefetchAppData(queryClient: QueryClient) {
  if (!isBrowserOnline()) return;

  const tasks = [
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["clients"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("clients")
            .select("id,full_name,phone,whatsapp,notes,created_at")
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(500);
          if (error) throw error;
          return data ?? [];
        },
      }),
    ),
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["clients-lite"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("clients")
            .select("id,full_name")
            .is("deleted_at", null)
            .order("full_name");
          if (error) throw error;
          return data ?? [];
        },
      }),
    ),
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["workshops"],
        queryFn: async () => {
          const [ws, settings] = await Promise.all([
            supabase
              .from("workshop_financials")
              .select("id,name,client_name,workflow_status,financial_status,remaining_base,final_amount_base,deadline,category,priority,created_at,paid_base")
              .order("created_at", { ascending: false })
              .limit(500),
            supabase.from("app_settings").select("base_currency").maybeSingle(),
          ]);
          if (ws.error) throw ws.error;
          return {
            workshops: ws.data ?? [],
            baseCurrency: settings.data?.base_currency ?? DEFAULT_CURRENCY,
          };
        },
      }),
    ),
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["settings"],
        queryFn: async () => {
          const [s, rates] = await Promise.all([
            supabase.from("app_settings").select("*").maybeSingle(),
            supabase.from("exchange_rates").select("*").order("effective_date", { ascending: false }),
          ]);
          return { settings: s.data, rates: rates.data ?? [] };
        },
      }),
    ),
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["payments-all"],
        queryFn: async () => {
          const [payments, settings] = await Promise.all([
            supabase
              .from("payments")
              .select("*,clients(full_name),workshops(name,id),created_at")
              .is("deleted_at", null)
              .order("received_date", { ascending: false })
              .limit(500),
            supabase.from("app_settings").select("base_currency").maybeSingle(),
          ]);
          if (payments.error) throw payments.error;
          return {
            payments: payments.data ?? [],
            baseCurrency: settings.data?.base_currency ?? DEFAULT_CURRENCY,
          };
        },
      }),
    ),
    queryClient.prefetchQuery(
      appQueryOptions({
        queryKey: ["expenses"],
        queryFn: async () => {
          const [exps, settings] = await Promise.all([
            supabase
              .from("expenses")
              .select("*")
              .is("deleted_at", null)
              .order("expense_date", { ascending: false })
              .limit(500),
            supabase.from("app_settings").select("base_currency").maybeSingle(),
          ]);
          if (exps.error) throw exps.error;
          return {
            expenses: exps.data ?? [],
            baseCurrency: settings.data?.base_currency ?? DEFAULT_CURRENCY,
          };
        },
      }),
    ),
  ];

  void Promise.allSettled(tasks);
}
