import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation as useTranslationActivity } from "react-i18next";
import { PageHeader } from "@/components/app-shell";
import { TimelinePanel } from "@/components/timeline-panel";
import { fetchGlobalActivity } from "@/lib/activity-queries";
import { prefetchRouteQuery } from "@/lib/prefetch-route";

const activityQuery = queryOptions({
  queryKey: ["activity"],
  queryFn: () => fetchGlobalActivity(200),
});

export const Route = createFileRoute("/_authenticated/activity")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, activityQuery);
  },
  component: ActivityPage,
});

function ActivityPage() {
  const { t } = useTranslationActivity();
  const { data: log } = useSuspenseQuery(activityQuery);
  return (
    <div>
      <PageHeader title={t("activity.title")} description={t("activity.subtitle")} />
      <TimelinePanel items={log} />
    </div>
  );
}
