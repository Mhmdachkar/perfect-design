import { useRouterState } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";

function Sh({ className }: { className?: string }) {
  return <Skeleton className={className} />;
}

function PageHeaderSkeleton({ stats = 0 }: { stats?: number }) {
  return (
    <div className="mb-6">
      <Sh className="h-8 w-48" />
      <Sh className="mt-2 h-4 w-72 max-w-full" />
      {stats > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="surface-card p-4 sm:p-5">
              <Sh className="h-3 w-20" />
              <Sh className="mt-3 h-7 w-24" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="surface-card mb-4 flex flex-wrap gap-2 px-4 py-3">
      <Sh className="h-8 w-24 rounded-lg" />
      <Sh className="h-8 w-28 rounded-lg" />
      <Sh className="h-8 w-20 rounded-lg" />
    </div>
  );
}

function ListRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface-card divide-y divide-border overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4">
          <Sh className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Sh className="h-4 w-2/5 max-w-[200px]" />
            <Sh className="h-3 w-1/3 max-w-[140px]" />
          </div>
          <Sh className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <PageHeaderSkeleton stats={4} />
      <Sh className="surface-card mb-6 h-72 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Sh className="surface-card h-64 rounded-xl" />
        <Sh className="surface-card h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <Sh className="surface-card mb-4 h-11 w-full rounded-xl" />
      <ListRowsSkeleton rows={8} />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <Sh className="mb-4 h-4 w-28" />
      <div className="surface-card mb-6 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Sh className="h-8 w-56 max-w-full" />
            <Sh className="h-4 w-40" />
            <div className="flex gap-2">
              <Sh className="h-6 w-20 rounded-full" />
              <Sh className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex gap-2">
            <Sh className="h-10 w-28 rounded-xl" />
            <Sh className="h-10 w-20 rounded-xl" />
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Sh key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Sh className="mt-5 h-2 w-full rounded-full" />
      </div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Sh key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <Sh className="surface-card h-64 rounded-xl" />
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-200">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Sh className="surface-card h-32 rounded-xl" />
        <Sh className="surface-card h-48 rounded-xl" />
        <Sh className="surface-card h-48 rounded-xl" />
      </div>
    </div>
  );
}

export function RoutePendingFallback() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return <DashboardPageSkeleton />;
  }
  if (/^\/clients\/[^/]+/.test(pathname) || /^\/workshops\/[^/]+/.test(pathname)) {
    return <DetailPageSkeleton />;
  }
  if (
    pathname === "/clients" ||
    pathname.startsWith("/clients/") ||
    pathname === "/workshops" ||
    pathname.startsWith("/workshops/") ||
    pathname === "/payments" ||
    pathname === "/expenses"
  ) {
    return <ListPageSkeleton />;
  }
  return <GenericPageSkeleton />;
}
