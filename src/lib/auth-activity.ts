import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invalidateAfterActivityChange } from "@/lib/invalidate-app-data";

async function rpcLog(
  action: string,
  entityType: string,
  entityId?: string | null,
  entityName?: string | null,
) {
  const { error } = await supabase.rpc("log_app_activity" as never, {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? null,
    p_entity_name: entityName ?? null,
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  } as never);
  if (error) console.error("activity log failed", error);
}

export async function logAuthActivity(action: "auth.signed_in" | "auth.signed_out") {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await rpcLog(action, "auth", u.user.id, u.user.email ?? "Administrator");
}

export async function logActivity(
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  metadata?: {
    ip?: string;
    userAgent?: string;
    reason?: string;
    queryClient?: QueryClient;
  },
) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await rpcLog(action, entityType, entityId ?? null, entityName ?? null);
  if (metadata?.queryClient) {
    invalidateAfterActivityChange(metadata.queryClient);
    if (entityId) {
      if (entityType === "client") {
        metadata.queryClient.invalidateQueries({ queryKey: ["client", entityId] });
      } else if (entityType === "workshop") {
        metadata.queryClient.invalidateQueries({ queryKey: ["workshop", entityId] });
      }
    }
  }
}
