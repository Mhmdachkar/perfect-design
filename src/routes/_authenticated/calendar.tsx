import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useUiStore } from "@/stores/ui-store";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { formatDate } from "@/lib/format";

const calendarQuery = queryOptions({
  queryKey: ["calendar-workshops"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("workshop_financials")
      .select("id,name,client_name,deadline,start_date,workflow_status,financial_status,final_amount_base")
      .not("deadline", "is", null);
    if (error) throw error;
    return data;
  },
});

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export const Route = createFileRoute("/_authenticated/calendar")({
  loader: ({ context }) => {
    prefetchRouteQuery(context.queryClient, calendarQuery);
  },
  component: CalendarPage,
});

function CalendarPage() {
  const { t } = useTranslation();
  const locale = useUiStore((s) => s.locale);
  const { data: items } = useSuspenseQuery(calendarQuery);
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const byDate = new Map<string, any[]>();
  for (const w of items) {
    if (!w.deadline) continue;
    const k = (w.deadline as string).slice(0, 10);
    const arr = byDate.get(k) ?? [];
    arr.push(w); byDate.set(k, arr);
  }
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString(locale === "ar" ? "ar-LB" : "en-US", { month: "long", year: "numeric" });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const monthAgenda = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const w of items) {
      if (!w.deadline) continue;
      const k = (w.deadline as string).slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(w);
      map.set(k, arr);
    }
    const list: { date: Date; events: any[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = date.toISOString().slice(0, 10);
      const events = map.get(key) ?? [];
      if (events.length > 0) list.push({ date, events });
    }
    return list;
  }, [items, year, month, daysInMonth]);

  return (
    <div>
      <PageHeader title={t("calendar.title")} description={t("calendarPage.subtitle")} />
      <div className="surface-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">{monthName}</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border hover:bg-surface-2 sm:h-8 sm:w-8"><ChevronLeft className="h-4 w-4 rtl-flip" /></button>
            <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface-2">{t("calendar.today")}</button>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-border hover:bg-surface-2 sm:h-8 sm:w-8"><ChevronRight className="h-4 w-4 rtl-flip" /></button>
          </div>
        </div>

        {/* Mobile agenda list */}
        <div className="space-y-3 md:hidden">
          {monthAgenda.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("empty.noScheduled")}</p>
          ) : (
            monthAgenda.map(({ date, events }) => (
              <div key={date.toISOString()} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatDate(date.toISOString())}
                </p>
                <ul className="space-y-2">
                  {events.map((ev: any) => (
                    <li key={ev.id}>
                      <Link
                        to="/workshops/$id"
                        params={{ id: ev.id }}
                        className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/15"
                      >
                        <span className="truncate">{ev.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{ev.client_name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Desktop month grid */}
        <div className="hidden grid-cols-7 gap-px border border-border bg-border text-xs md:grid">
          {WEEKDAY_KEYS.map((d) => (
            <div key={d} className="bg-surface-2 px-2 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{t(`weekdays.${d}`)}</div>
          ))}
          {cells.map((c, i) => {
            const key = c.date ? c.date.toISOString().slice(0, 10) : `e${i}`;
            const events = c.date ? (byDate.get(key) ?? []) : [];
            const isToday = c.date && c.date.getTime() === today.getTime();
            return (
              <div key={key} className={`min-h-[88px] bg-surface p-1.5 ${!c.date ? "opacity-50" : ""}`}>
                {c.date && (
                  <>
                    <div className={`mb-1 text-[11px] font-medium ${isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                      {c.date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((ev: any) => (
                        <Link key={ev.id} to="/workshops/$id" params={{ id: ev.id }}
                          className="block truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20">
                          {ev.name}
                        </Link>
                      ))}
                      {events.length > 3 && <p className="text-[10px] text-muted-foreground">{t("calendar.more", { count: events.length - 3 })}</p>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {items.length === 0 && <div className="mt-6"><Empty icon={CalendarIcon} title={t("empty.noScheduled")} description={t("calendarPage.emptyDescription")} /></div>}
    </div>
  );
}
