import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { appQueryOptions } from "@/lib/offline/app-query";

/** Non-blocking prefetch — navigation proceeds immediately; Suspense shows skeleton until ready. */
export function prefetchRouteQuery(
  queryClient: QueryClient,
  options: { queryKey: QueryKey; queryFn: () => Promise<unknown> },
) {
  void queryClient.prefetchQuery(appQueryOptions(options as Parameters<typeof appQueryOptions>[0]));
}
