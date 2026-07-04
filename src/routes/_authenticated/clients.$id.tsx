import { useTranslation } from "react-i18next";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { appQueryOptions, useAppSuspenseQuery } from "@/lib/offline/app-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Empty } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { Briefcase, MessageCircle, Trash2, FileText, Wallet, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatDateTimeFull, formatMoney, initialsOf, relativeTime } from "@/lib/format";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/currency";
import { runSoftDelete } from "@/lib/offline/run-write";
import { fetchClientActivity } from "@/lib/activity-queries";
import { prefetchRouteQuery } from "@/lib/prefetch-route";
import { NotesPanel } from "@/components/notes-panel";
import { TimelinePanel } from "@/components/timeline-panel";
import { DocumentList } from "@/components/documents/document-list";
import { PaymentDialog } from "@/components/payment-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { allowOfflineEntityAccess } from "@/lib/offline/route-guard";
import { StatusPill } from "@/components/status-pill";

const clientDetail = (id: string) => appQueryOptions({
  queryKey: ["client", id],
  queryFn: async () => {
    const [c, workshops, payments, expenses, notes, activity, settings] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
      supabase.from("workshop_financials").select("id,name,workflow_status,financial_status,remaining_base,final_amount_base,deadline,category,priority,created_at,paid_base").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*,workshops(name),created_at").eq("client_id", id).is("deleted_at", null).order("received_date", { ascending: false }),
      supabase.from("expenses").select("*").eq("client_id", id).is("deleted_at", null).order("expense_date", { ascending: false }),
      supabase.from("notes").select("*").eq("entity_type", "client").eq("entity_id", id).is("deleted_at", null).order("created_at", { ascending: false }),
      fetchClientActivity(id),
      supabase.from("app_settings").select("base_currency").maybeSingle(),
    ]);
    if (c.error) throw c.error;
    if (!c.data) throw new Error("Client not found");
    return {
      client: c.data,
      workshops: workshops.data ?? [],
      payments: payments.data ?? [],
      expenses: expenses.data ?? [],
      notes: notes.data ?? [],
      activity: activity ?? [],
      baseCurrency: settings.data?.base_currency ?? DEFAULT_CURRENCY,
    };
  },
});

export const Route = createFileRoute("/_authenticated/clients/$id")({
  beforeLoad: async ({ params, context }) => {
    const allowed = await allowOfflineEntityAccess(
      context.queryClient,
      ["client", params.id],
      async () => {
        const { data } = await supabase.from("clients").select("id").eq("id", params.id).is("deleted_at", null).maybeSingle();
        return !!data;
      },
    );
    if (!allowed) throw redirect({ to: "/clients" });
  },
  loader: ({ context, params }) => {
    prefetchRouteQuery(context.queryClient, clientDetail(params.id));
  },
  component: ClientDetail,
});

function ClientDetail() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { data } = useAppSuspenseQuery(clientDetail(id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const c = data.client;
  const ccy = data.baseCurrency;
  const phone = c.phone || c.whatsapp || "";

  const totalRevenue = data.workshops.reduce((s, w: any) => s + Number(w.final_amount_base || 0), 0);
  const totalReceived = data.workshops.reduce((s, w: any) => s + Number(w.paid_base || 0), 0);
  const outstanding = totalRevenue - totalReceived;

  async function softDelete() {
    if (!confirm(t("confirm.deleteClient", { name: c.full_name }))) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await runSoftDelete({
      qc,
      t,
      table: "clients",
      id: c.id,
      userId: u.user.id,
      onSaved: () => navigate({ to: "/clients" }),
    });
  }

  return (
    <div>
      <Link to="/clients" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5 rtl-flip" /> {t("detail.allClients")}
      </Link>

      <div className="surface-card mb-6 p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-base font-semibold text-primary-foreground">
              {initialsOf(c.full_name)}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{c.full_name}</h1>
              <p className="text-sm text-muted-foreground">{phone || "—"} · {t("clientsPage.added", { time: relativeTime(c.created_at) })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {phone && <WhatsAppButton phone={phone} />}
            <EditClientDialog client={c} />
            <Button variant="outline" size="icon" className="rounded-xl" onClick={softDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {phone && <InfoRow icon={MessageCircle} label={t("clientsPage.phone")} value={phone} />}
          {c.notes && <InfoRow icon={FileText} label={t("common.notes")} value={c.notes} />}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-3">
          <Stat label={t("detail.totalRevenue")} value={formatMoney(totalRevenue, ccy)} />
          <Stat label={t("detail.received")} value={formatMoney(totalReceived, ccy)} tone="success" />
          <Stat label={t("detail.outstanding")} value={formatMoney(outstanding, ccy)} tone={outstanding > 0 ? "warn" : undefined} />
        </div>
      </div>

      <Tabs defaultValue="workshops" className="w-full">
        <TabsList className="w-full max-w-full justify-start">
          <TabsTrigger value="workshops">{t("tabs.workshops")} ({data.workshops.length})</TabsTrigger>
          <TabsTrigger value="payments">{t("tabs.payments")} ({data.payments.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t("tabs.expenses")} ({data.expenses.length})</TabsTrigger>
          <TabsTrigger value="notes">{t("tabs.notes")} ({data.notes.length})</TabsTrigger>
          <TabsTrigger value="documents">{t("tabs.documents")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("tabs.timeline")}</TabsTrigger>
        </TabsList>

        <TabsContent value="workshops" className="mt-4">
          {data.workshops.length === 0 ? (
            <Empty icon={Briefcase} title={t("empty.noWorkshops")} description={t("clientsPage.firstWorkshopEmpty")} />
          ) : (
            <ul className="surface-card divide-y divide-border">
              {data.workshops.map((w: any) => (
                <li key={w.id}>
                  <Link to="/workshops/$id" params={{ id: w.id }} className="grid grid-cols-[1fr_auto] items-center gap-4 p-4 hover:bg-surface-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{w.name}</p>
                        <StatusPill status={w.workflow_status} />
                        <StatusPill status={w.financial_status} kind="financial" />
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{w.deadline ? t("detail.due", { date: formatDate(w.deadline) }) : t("detail.noDeadline")}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold num-tabular">{formatMoney(w.final_amount_base, ccy)}</p>
                      <p className="text-muted-foreground">{formatMoney(w.paid_base, ccy)} {t("workshops.paid").toLowerCase()}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="mb-3 flex justify-end">
            <PaymentDialog clientId={c.id} defaultCurrency={DEFAULT_CURRENCY} trigger={<Button className="rounded-xl"><Wallet className="mr-1.5 h-4 w-4" />{t("payments.newPayment")}</Button>} />
          </div>
          {data.payments.length === 0 ? (
            <Empty icon={Wallet} title={t("empty.noPayments")} action={<PaymentDialog clientId={c.id} defaultCurrency={DEFAULT_CURRENCY} />} />
          ) : (
            <ul className="surface-card divide-y divide-border">
              {data.payments.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.workshops?.name ?? t("detail.payment")}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeFull(p.received_date)} · {p.method}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold num-tabular text-success">{formatMoney(p.amount, normalizeCurrency(p.currency))}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="mb-3 flex justify-end">
            <ExpenseDialog clientId={c.id} trigger={<Button className="rounded-xl"><FileText className="mr-1.5 h-4 w-4" />{t("expenses.newExpense")}</Button>} />
          </div>
          {data.expenses.length === 0 ? (
            <Empty icon={FileText} title={t("empty.noExpenses")} action={<ExpenseDialog clientId={c.id} />} />
          ) : (
            <ul className="surface-card divide-y divide-border">
              {data.expenses.map((e: any) => (
                <li key={e.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{t(`expenses.categories.${e.category}`)} · {formatDate(e.expense_date)}</p>
                  </div>
                  <p className="text-sm font-semibold num-tabular text-destructive">−{formatMoney(e.amount, normalizeCurrency(e.currency))}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesPanel entityType="client" entityId={c.id} notes={data.notes} queryKey={["client", id]} />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <section className="surface-card p-5">
            <DocumentList entityType="client" entityId={c.id} />
          </section>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelinePanel items={data.activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warn" }) {
  const cls = tone === "success" ? "text-success" : tone === "warn" ? "text-warning" : "";
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold num-tabular ${cls}`}>{value}</p>
    </div>
  );
}
