import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/app-shell";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SummaryTone = "success" | "warn" | "destructive";

export type SummaryItem = {
  label: string;
  value: string;
  tone?: SummaryTone;
  to?: "/dashboard/$metric" | "/payments" | "/expenses" | "/workshops" | "/clients";
  params?: { metric?: string; id?: string };
};

type EntityRoute =
  | { to: "/clients/$id"; params: { id: string } }
  | { to: "/workshops/$id"; params: { id: string } }
  | { to: "/dashboard/$metric"; params: { metric: string } };

export function DashboardDetailShell({
  title,
  description,
  totalLabel,
  totalDisplay,
  formula,
  summaries,
  relatedLinks,
  children,
}: {
  title: string;
  description: string;
  totalLabel: string;
  totalDisplay: string;
  formula: string;
  summaries?: SummaryItem[];
  relatedLinks?: SummaryItem[];
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
        {t("dashboardDetail.backToDashboard")}
      </Link>

      <PageHeader title={title} description={description} />

      <div className="surface-card mb-6 p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{totalLabel}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight num-tabular text-foreground">
          {totalDisplay}
        </p>
        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("dashboardDetail.howCalculated")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{formula}</p>
        </div>
        {summaries && summaries.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {summaries.map((s) => (
              <SummaryCard key={s.label} item={s} />
            ))}
          </dl>
        )}
        {relatedLinks && relatedLinks.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            <span className="w-full text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("dashboardDetail.relatedPages")}
            </span>
            {relatedLinks.map((link) => (
              <RelatedChip key={link.label} item={link} />
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

function toneClass(tone?: SummaryTone) {
  if (tone === "success") return "text-success";
  if (tone === "warn") return "text-warning";
  if (tone === "destructive") return "text-destructive";
  return "";
}

function SummaryCard({ item }: { item: SummaryItem }) {
  const { t } = useTranslation();
  const content = (
    <>
      <dt className="text-xs text-muted-foreground">{item.label}</dt>
      <dd className={cn("mt-1 text-lg font-semibold num-tabular", toneClass(item.tone))}>
        {item.value}
      </dd>
    </>
  );

  if (!item.to) {
    return <div>{content}</div>;
  }

  return (
    <Link
      to={item.to as any}
      params={item.params as any}
      className="group rounded-xl border border-transparent p-2 -m-2 transition-all hover:border-border hover:bg-surface-2/60"
    >
      {content}
      <span className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        {t("dashboardDetail.viewDetails")}
        <ArrowUpRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function RelatedChip({ item }: { item: SummaryItem }) {
  if (!item.to) return null;
  return (
    <Link
      to={item.to as any}
      params={item.params as any}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      {item.label}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

export function DetailSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface-card mb-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function DetailTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="w-full min-w-[640px] text-sm">
      <thead>
        <tr className="border-b border-border bg-surface-2/50 text-start text-xs text-muted-foreground">
          {headers.map((h) => (
            <th key={h} className="px-4 py-2.5 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">{children}</tbody>
    </table>
  );
}

export function DetailRow({
  cells,
  navigateTo,
}: {
  cells: ReactNode[];
  navigateTo?: EntityRoute;
}) {
  const navigate = useNavigate();

  return (
    <tr
      className={cn(
        "transition-colors",
        navigateTo
          ? "cursor-pointer hover:bg-primary/[0.04] group/row"
          : "hover:bg-surface-2/40",
      )}
      onClick={
        navigateTo
          ? (e) => {
              const target = e.target as HTMLElement;
              if (target.closest("a, button")) return;
              navigate(navigateTo as any);
            }
          : undefined
      }
      onKeyDown={
        navigateTo
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(navigateTo as any);
              }
            }
          : undefined
      }
      tabIndex={navigateTo ? 0 : undefined}
      role={navigateTo ? "link" : undefined}
    >
      {cells.map((cell, i) => (
        <td key={i} className="px-4 py-3 align-middle">
          {cell}
        </td>
      ))}
    </tr>
  );
}

const linkClass =
  "inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary hover:underline underline-offset-2";

export function EntityLink({ to, params, children }: EntityRoute & { children: ReactNode }) {
  return (
    <Link to={to} params={params} className={linkClass}>
      {children}
      <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />
    </Link>
  );
}

export function ClientLink({ id, name }: { id?: string | null; name?: string | null }) {
  if (!id || !name) return <span className="text-muted-foreground">—</span>;
  return (
    <EntityLink to="/clients/$id" params={{ id }}>
      {name}
    </EntityLink>
  );
}

export function WorkshopLink({ id, name, fallback }: { id?: string | null; name?: string | null; fallback?: string }) {
  const { t } = useTranslation();
  const label = name ?? fallback ?? t("detail.payment");
  if (!id) return <span>{label}</span>;
  return (
    <EntityLink to="/workshops/$id" params={{ id }}>
      {label}
    </EntityLink>
  );
}

export function ListPageLink({
  to,
  children,
}: {
  to: "/payments" | "/expenses" | "/workshops" | "/clients";
  children: ReactNode;
}) {
  return (
    <Link to={to} className={linkClass}>
      {children}
      <ArrowUpRight className="h-3 w-3 shrink-0 opacity-60" />
    </Link>
  );
}
