import { useTranslation } from "react-i18next";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Empty } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EditWorkshopDialog } from "@/components/workshop-dialog";
import { ArrowLeft, Pencil, Trash2, CalendarDays, User, FileDown } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTimeFull, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { softDeleteRow } from "@/lib/soft-delete";
import { NotesPanel } from "@/components/notes-panel";
import { DocumentList } from "@/components/documents/document-list";
import { PaymentDialog } from "@/components/payment-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TimelinePanel } from "@/components/timeline-panel";
import { WorkshopTagPicker } from "@/components/workshop-tags";
import { WorkshopInvoice } from "@/components/workshop-invoice";
import { invalidateAfterWorkshopChange, invalidateAfterPaymentChange } from "@/lib/invalidate-app-data";
import { fetchWorkshopActivity } from "@/lib/activity-queries";
import { logActivity } from "@/lib/auth-activity";
import { prefetchRouteQuery } from "@/lib/prefetch-route";

const workshopDetail = (id: string) => queryOptions({
  queryKey: ["workshop", id],
  queryFn: async () => {
    const [w, fin, payments, notes, activity, tagAssigns] = await Promise.all([
      supabase.from("workshops").select("*,clients(id,full_name,company)").eq("id", id).is("deleted_at", null).maybeSingle(),
      supabase.from("workshop_financials").select("final_amount,final_amount_base,paid_base,remaining_base,financial_status,last_payment_date").eq("id", id).maybeSingle(),
      supabase.from("payments").select("*,created_at").eq("workshop_id", id).is("deleted_at", null).order("received_date", { ascending: false }),
      supabase.from("notes").select("*").eq("entity_type", "workshop").eq("entity_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
      fetchWorkshopActivity(id),
      supabase.from("workshop_tag_assignments").select("tag_id").eq("workshop_id", id),
    ]);
    if (w.error) throw w.error;
    if (!w.data) throw new Error("Workshop not found");
    return {
      w: w.data, fin: fin.data, payments: payments.data ?? [], notes: notes.data ?? [],
      activity: activity ?? [], tagIds: (tagAssigns.data ?? []).map((t) => t.tag_id),
    };
  },
});

export const Route = createFileRoute("/_authenticated/workshops/$id")({
  beforeLoad: async ({ params }) => {
    const { data } = await supabase.from("workshops").select("id").eq("id", params.id).is("deleted_at", null).maybeSingle();
    if (!data) throw redirect({ to: "/workshops" });
  },
  loader: ({ context, params }) => {
    prefetchRouteQuery(context.queryClient, workshopDetail(params.id));
  },
  component: WorkshopDetail,
});

const WORKFLOW_STATUSES = ["planning", "in_progress", "waiting", "completed", "cancelled", "archived"] as const;

function WorkshopDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(workshopDetail(id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { w, fin, payments, notes, activity, tagIds } = data;
  const ccy = w.currency;

  async function softDelete() {
    if (!confirm(t("confirm.deleteWorkshop"))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await softDeleteRow("workshops", w.id, u.user.id);
    if (error) return toast.error(error.message);
    invalidateAfterWorkshopChange(qc);
    navigate({ to: "/workshops" });
  }

  async function setWorkflowStatus(value: string) {
    const { error } = await supabase.from("workshops").update({ workflow_status: value as any }).eq("id", w.id);
    if (error) return toast.error(error.message);
    invalidateAfterWorkshopChange(qc);
    toast.success(t("toasts.statusUpdated"));
  }

  async function printInvoice() {
    await logActivity("workshop.invoice_printed", "workshop", w.id, w.name, { queryClient: qc });
    window.print();
  }

  const fa: any = fin ?? {};
  const final = Number(fa.final_amount_base ?? w.price - w.discount);
  const paid = Number(fa.paid_base ?? 0);
  const remaining = Math.max(final - paid, 0);
  const progress = final > 0 ? Math.min(100, (paid / final) * 100) : 0;
  const financialStatus = (fa.financial_status ?? "pending") as string;

  return (
    <div>
      <WorkshopInvoice workshop={w} fin={fa} payments={payments} />
      <Link to="/workshops" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" /> {t("detail.allWorkshops")}
      </Link>

      <div className="surface-card mb-6 p-6 sm:p-7 print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{w.name}</h1>
              <StatusPill status={w.workflow_status} />
              <StatusPill status={financialStatus} kind="financial" />
              <StatusPill status={w.priority} kind="priority" />
            </div>
            <Link to="/clients/$id" params={{ id: w.clients.id }} className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <User className="h-3.5 w-3.5" /> {w.clients.full_name}{w.clients.company ? ` · ${w.clients.company}` : ""}
            </Link>
            {w.category && (
              <p className="mt-1 text-sm text-muted-foreground">{t("detail.type")}: <span className="text-foreground">{w.category}</span></p>
            )}
            <WorkshopTagPicker workshopId={w.id} assignedIds={tagIds} />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={printInvoice}>
              <FileDown className="me-1.5 h-4 w-4" />{t("detail.printQuote")}
            </Button>
            <EditWorkshopDialog workshop={w} />
            <Button variant="outline" size="icon" className="rounded-xl" onClick={softDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("detail.total")} value={formatMoney(final, ccy)} />
          <Stat label={t("detail.paid")} value={formatMoney(paid, ccy)} tone="success" />
          <Stat label={t("detail.remaining")} value={formatMoney(remaining, ccy)} tone={remaining > 0 ? "warn" : undefined} />
          <Stat label={t("detail.deadline")} value={formatDate(w.deadline)} icon={CalendarDays} />
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("detail.paymentProgress")}</span>
            <span className="font-medium num-tabular">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("detail.workflowStatus")}</Label>
            <Select value={w.workflow_status} onValueChange={setWorkflowStatus}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("detail.financialStatus")}</Label>
            <div className="mt-2">
              <StatusPill status={financialStatus} kind="financial" />
              <p className="mt-1 text-[11px] text-muted-foreground">{t("detail.calculatedFromPayments")}</p>
            </div>
          </div>
        </div>

        {w.description && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("detail.description")}</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm">{w.description}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="payments" className="mt-6 print:hidden">
        <TabsList className="w-full max-w-full justify-start">
          <TabsTrigger value="payments">{t("tabs.payments")}</TabsTrigger>
          <TabsTrigger value="notes">{t("tabs.notes")}</TabsTrigger>
          <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <section className="surface-card p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">{t("tabs.payments")}</h2>
              <PaymentDialog workshopId={w.id} clientId={w.client_id} defaultCurrency={w.currency} />
            </div>
            {payments.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{t("empty.noPaymentsRecorded")}</p> : (
              <ul className="divide-y divide-border">
                {payments.map((p) => (
                  <PaymentRow key={p.id} p={p} workshopId={w.id} clientId={w.client_id} />
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesPanel entityType="workshop" entityId={w.id} notes={notes} queryKey={["workshop", id]} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <section className="surface-card p-5 sm:p-6">
            <DocumentList entityType="workshop" entityId={w.id} />
          </section>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelinePanel items={activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }: { label: string; value: string; tone?: "success" | "warn"; icon?: any }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-warning" : "";
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 text-lg font-semibold num-tabular ${cls}`}>{value}</p>
    </div>
  );
}

function PaymentRow({ p, workshopId, clientId }: { p: any; workshopId: string; clientId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  async function del() {
    if (!confirm(t("confirm.deletePayment"))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await softDeleteRow("payments", p.id, u.user.id);
    if (error) return toast.error(error.message);
    invalidateAfterPaymentChange(qc);
  }
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{formatMoney(p.amount, p.currency)}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {p.method ? t(`payments.methods.${p.method}`, { defaultValue: p.method.replace(/_/g, " ") }) : "—"}
          {p.received_date ? ` · ${t("detail.receivedAt", { date: formatDateTimeFull(p.received_date) })}` : ` · ${t("detail.awaitingReceipt")}`}
          {p.due_date && ` · ${t("detail.due", { date: formatDateTimeFull(p.due_date) })}`}
        </p>
        {(p.reference || p.notes) && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {p.reference && t("detail.ref", { ref: p.reference })}
            {p.reference && p.notes && " · "}
            {p.notes}
          </p>
        )}
        {p.created_at && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{t("detail.logged", { date: formatDateTimeFull(p.created_at) })}</p>
        )}
      </div>
      <div className="flex gap-1">
        <PaymentDialog payment={p} workshopId={workshopId} clientId={clientId} trigger={<Button variant="ghost" size="icon"><Pencil className="h-3.5 w-3.5" /></Button>} />
        <Button variant="ghost" size="icon" onClick={del}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </li>
  );
}