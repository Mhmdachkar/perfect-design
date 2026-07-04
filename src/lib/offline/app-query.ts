import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { getOfflineQueryFallback } from "./query-fallbacks";
import { isBrowserOnline, isSlowConnection, isTimeoutError, markConnectionDegraded } from "./network";

const OFFLINE_QUERY_DEFAULTS = {
  networkMode: "offlineFirst" as const,
  gcTime: 24 * 60 * 60_000,
  staleTime: 30_000,
};

function wrapQueryFn<T>(queryKey: QueryKey, queryFn: QueryFunction<T, QueryKey, never>) {
  return async (ctx: Parameters<QueryFunction<T, QueryKey, never>>[0]) => {
    const cached = ctx.client.getQueryData<T>(queryKey);
    if (!isBrowserOnline()) {
      if (cached !== undefined) return cached;
      return getOfflineQueryFallback<T>(queryKey);
    }

    try {
      return await queryFn(ctx);
    } catch (err) {
      if (cached !== undefined) return cached;
      if (isTimeoutError(err)) markConnectionDegraded();
      if (!isBrowserOnline() || isSlowConnection()) return getOfflineQueryFallback<T>(queryKey);
      throw err;
    }
  };
}

export function appQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
  },
) {
  return queryOptions({
    ...OFFLINE_QUERY_DEFAULTS,
    ...options,
    queryFn: wrapQueryFn(options.queryKey, options.queryFn as QueryFunction<TQueryFnData, QueryKey, never>),
  });
}

export function useAppSuspenseQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
  },
) {
  return useSuspenseQuery(appQueryOptions(options));
}

export function useAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
  },
) {
  return useQuery(appQueryOptions(options));
}
