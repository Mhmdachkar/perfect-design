import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const WORKFLOW_STYLES: Record<string, string> = {
  planning: "bg-info/15 text-info",
  in_progress: "bg-primary/15 text-primary",
  waiting: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const FINANCIAL_STYLES: Record<string, string> = {
  paid: "bg-success/15 text-success",
  partial: "bg-info/15 text-info",
  pending: "bg-muted text-muted-foreground",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-warning/15 text-warning",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/15 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export function StatusPill({ status, kind = "workflow", className }: {
  status: string; kind?: "workflow" | "financial" | "priority"; className?: string;
}) {
  const { t } = useTranslation();
  const map = kind === "financial" ? FINANCIAL_STYLES : kind === "priority" ? PRIORITY_STYLES : WORKFLOW_STYLES;
  const label = t(`statuses.${status}`, { defaultValue: status.replace(/_/g, " ") });
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
      map[status] ?? "bg-muted text-muted-foreground",
      className
    )}>{label}</span>
  );
}

export function Tag({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {name}
    </span>
  );
}
