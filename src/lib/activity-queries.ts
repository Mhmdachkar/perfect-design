import { supabase } from "@/integrations/supabase/client";

export type ActivityRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name?: string | null;
  prev_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
};

async function currentUserId() {
  const { data: u } = await supabase.auth.getUser();
  return u.user?.id ?? null;
}

/** Global activity feed (Activity page). */
export async function fetchGlobalActivity(limit = 200): Promise<ActivityRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

/** Client detail timeline: direct changes + related workshops/payments/expenses. */
export async function fetchClientActivity(clientId: string, limit = 50): Promise<ActivityRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const filter = [
    `entity_id.eq.${clientId}`,
    `new_values->>client_id.eq.${clientId}`,
    `prev_values->>client_id.eq.${clientId}`,
  ].join(",");

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", userId)
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}

/** Workshop detail timeline: direct changes + related payments/notes/documents/tags. */
export async function fetchWorkshopActivity(workshopId: string, limit = 50): Promise<ActivityRow[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const filter = [
    `entity_id.eq.${workshopId}`,
    `new_values->>workshop_id.eq.${workshopId}`,
    `prev_values->>workshop_id.eq.${workshopId}`,
  ].join(",");

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("user_id", userId)
    .or(filter)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityRow[];
}
