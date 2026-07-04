import { Suspense } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { RoutePendingFallback } from "@/components/page-skeletons";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";
import { getAuthenticatedUser } from "@/lib/offline/offline-auth";
import { prefetchAppData } from "@/lib/offline/prefetch-app-data";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: RoutePendingFallback,
  beforeLoad: async ({ location, context }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      throw redirect({
        to: "/auth",
        search: { redirect: sanitizeRedirectPath(location.href) },
      });
    }
    prefetchAppData(context.queryClient);
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    prefetchAppData(queryClient);
  }, [queryClient]);

  return (
    <AppShell>
      <Suspense fallback={<RoutePendingFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
