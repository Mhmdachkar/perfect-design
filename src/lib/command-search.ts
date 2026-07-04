import { appQueryOptions } from "@/lib/offline/app-query";
import { supabase } from "@/integrations/supabase/client";

export type CommandSearchResult = {
  clients: { id: string; full_name: string; company: string | null }[];
  workshops: { id: string; name: string; client_name: string | null }[];
  payments: { id: string; reference: string | null; amount: number; currency: string; workshop_id: string | null }[];
};

export const commandSearchQuery = appQueryOptions({
  queryKey: ["command-search"],
  queryFn: async (): Promise<CommandSearchResult> => {
    const [clients, workshops, payments] = await Promise.all([
      supabase.from("clients").select("id,full_name,company").is("deleted_at", null).order("full_name").limit(80),
      supabase.from("workshop_financials").select("id,name,client_name").order("created_at", { ascending: false }).limit(80),
      supabase.from("payments").select("id,reference,amount,currency,workshop_id").is("deleted_at", null).order("received_date", { ascending: false }).limit(40),
    ]);
    return {
      clients: clients.data ?? [],
      workshops: workshops.data ?? [],
      payments: payments.data ?? [],
    };
  },
  staleTime: 60_000,
});

export type NotificationItem = {
  id: string;
  kind: "overdue" | "deadline";
  title: string;
  subtitle: string;
  to: string;
  params?: { id: string };
};

export const notificationsQuery = appQueryOptions({
  queryKey: ["notifications"],
  queryFn: async (): Promise<NotificationItem[]> => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const week = new Date(today);
    week.setDate(week.getDate() + 7);
    const weekStr = week.toISOString().slice(0, 10);

    const [overdue, deadlines] = await Promise.all([
      supabase
        .from("workshop_financials")
        .select("id,name,client_name,remaining_base")
        .eq("financial_status", "overdue")
        .order("deadline", { ascending: true })
        .limit(12),
      supabase
        .from("workshop_financials")
        .select("id,name,client_name,deadline")
        .not("deadline", "is", null)
        .gte("deadline", todayStr)
        .lte("deadline", weekStr)
        .in("workflow_status", ["planning", "in_progress", "waiting"])
        .order("deadline", { ascending: true })
        .limit(12),
    ]);

    const items: NotificationItem[] = [];
    for (const w of overdue.data ?? []) {
      items.push({
        id: `overdue-${w.id}`,
        kind: "overdue",
        title: w.name,
        subtitle: `${w.client_name ?? "Client"} · payment overdue`,
        to: "/workshops/$id",
        params: { id: w.id },
      });
    }
    for (const w of deadlines.data ?? []) {
      items.push({
        id: `deadline-${w.id}`,
        kind: "deadline",
        title: w.name,
        subtitle: `${w.client_name ?? "Client"} · due ${w.deadline}`,
        to: "/workshops/$id",
        params: { id: w.id },
      });
    }
    return items;
  },
  staleTime: 60_000,
});
