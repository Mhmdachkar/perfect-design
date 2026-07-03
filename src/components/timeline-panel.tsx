import { useTranslation } from "react-i18next";
import { activityLabel, groupActivityByDate } from "@/lib/activity-labels";
import { Empty } from "@/components/app-shell";
import { Activity } from "lucide-react";

type ActivityEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_name?: string | null;
  prev_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
};

export function TimelinePanel({ items }: { items: ActivityEntry[] }) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return <Empty icon={Activity} title={t("empty.noActivity")} />;
  }

  const groups = groupActivityByDate(items);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.date}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
          <ol className="surface-card divide-y divide-border">
            {group.items.map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-4">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm">{activityLabel(a)}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
