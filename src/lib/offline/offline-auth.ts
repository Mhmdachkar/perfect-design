import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isBrowserOnline } from "./network";

/** Resolve the signed-in user from local session when offline. */
export async function getAuthenticatedUser(): Promise<User | null> {
  if (!isBrowserOnline()) {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
