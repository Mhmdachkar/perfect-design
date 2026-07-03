import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Non-blocking prefetch — navigation proceeds immediately; Suspense shows skeleton until ready. */
export function prefetchRouteQuery(
  queryClient: QueryClient,
  options: { queryKey: QueryKey; queryFn: () => Promise<unknown> },
) {
  void queryClient.prefetchQuery(options);
}
