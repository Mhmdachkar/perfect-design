import { Suspense } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { RoutePendingFallback } from "@/components/page-skeletons";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: RoutePendingFallback,
  beforeLoad: async ({ location }) => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw redirect({
        to: "/auth",
        search: { redirect: sanitizeRedirectPath(location.href) },
      });
    }
    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Suspense fallback={<RoutePendingFallback />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
