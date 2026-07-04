import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { isBrowserOnline } from "./network";

/** Skip live existence checks when offline so detail pages can open from cache. */
export async function allowOfflineEntityAccess(
  _queryClient: QueryClient,
  _queryKey: QueryKey,
  checkExistsOnline: () => Promise<boolean>,
) {
  if (!isBrowserOnline()) return true;
  return checkExistsOnline();
}
