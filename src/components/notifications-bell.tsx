import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, AlertCircle, CalendarClock } from "lucide-react";
import { notificationsQuery } from "@/lib/command-search";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationsBell({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: items = [] } = useQuery(notificationsQuery);
  const count = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "icon" : "sm"}
          className={cn("relative rounded-xl", !compact && "gap-1.5")}
          aria-label={t("notifications.title")}
        >
          <Bell className="h-4 w-4" />
          {!compact && <span className="hidden sm:inline">{t("notifications.title")}</span>}
          {count > 0 && (
            <span className="absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{t("notifications.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("notifications.empty")}</p>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
              onClick={() => navigate({ to: item.to, params: item.params } as any)}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {item.kind === "overdue"
                  ? <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  : <CalendarClock className="h-3.5 w-3.5 text-warning" />}
                <span className="truncate">{item.title}</span>
              </span>
              <span className="ps-5 text-xs text-muted-foreground">{item.subtitle}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
