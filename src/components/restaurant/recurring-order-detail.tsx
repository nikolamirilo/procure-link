"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  toggleRecurringOrder,
  deleteRecurringOrder,
  runRecurringOrderNow,
} from "@/lib/actions/recurring-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney, formatDay } from "@/lib/format";
import { AUTOMATION_STATUSES } from "@/lib/constants";
import type { Locale } from "@/i18n/config";
import {
  Pause,
  Play,
  Trash2,
  Pencil,
  Loader2,
  Zap,
  CalendarClock,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Item {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface Run {
  id: string;
  status: string;
  error_message: string | null;
  run_at: string | null;
  order_id: string | null;
  order_number?: string | null;
}

interface RecurringOrderData {
  id: string;
  name: string;
  frequency: string;
  schedule_days: number[];
  delivery_offset_days: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string | null;
  supplier_name: string;
  items: Item[];
  runs: Run[];
}

export function RecurringOrderDetail({
  order,
  currency = "RSD",
}: {
  order: RecurringOrderData;
  currency?: string;
}) {
  const router = useRouter();
  const t = useTranslations("recurring");
  const td = useTranslations("days");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const money = (n: number) => formatMoney(n, currency, locale);

  const estimatedTotal = order.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  function scheduleSummary(frequency: string, days: number[]): string {
    if (frequency === "daily") return t("everyDay");
    if (!days || days.length === 0) return t("notConfigured");
    if (frequency === "weekly") return days.map((d) => td(String(d))).join(", ");
    return days.map((d) => `${d}.`).join(", ") + t("ofEachMonth");
  }

  const freqLabel =
    order.frequency === "daily" ? t("daily") : order.frequency === "weekly" ? t("weekly") : t("monthly");

  function handleToggle() {
    startTransition(async () => {
      const r = await toggleRecurringOrder(order.id, !order.is_active);
      if (r?.error) toast.error(r.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteRecurringOrder(order.id);
      if (r?.error) toast.error(r.error);
      else router.push("/restaurant/automations");
    });
  }

  function handleRunNow() {
    startTransition(async () => {
      const r = await runRecurringOrderNow(order.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success(t("runNowSuccess", { number: String(r.orderNumber ?? "") }));
        router.refresh();
      }
    });
  }

  const statusLabel = (s: string) =>
    s === "success" ? t("statusSuccess") : s === "error" ? t("statusError") : t("statusSkipped");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{order.name}</h1>
            <Badge
              className={
                order.is_active
                  ? AUTOMATION_STATUSES.active.color
                  : AUTOMATION_STATUSES.paused.color
              }
            >
              {order.is_active ? t("active") : t("paused")}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{order.supplier_name}</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm" className="gap-1" disabled={pending}>
                <Zap className="h-3.5 w-3.5" />
                {t("runNow")}
              </Button>
            }
            title={t("runNowTitle")}
            description={t("runNowBody")}
            confirmLabel={t("runNow")}
            onConfirm={handleRunNow}
          />
          <Link href={`/restaurant/automations/${order.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              {t("edit")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1" disabled={pending} onClick={handleToggle}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : order.is_active ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {order.is_active ? t("pause") : t("resume")}
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" disabled={pending}>
                <Trash2 className="h-3.5 w-3.5" />
                {t("delete")}
              </Button>
            }
            title={t("deleteTitle")}
            description={t("deleteBody")}
            confirmLabel={t("delete")}
            variant="destructive"
            onConfirm={handleDelete}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card premium-shadow overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30">
              <h2 className="font-bold text-base">{t("orderItems")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("itemsPerOrder", { count: order.items.length })}</p>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <span className="font-semibold">{item.product_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{money(item.unit_price)} / {item.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold tabular-nums">{item.quantity} {item.unit}</span>
                    <span className="text-muted-foreground ml-3 text-xs tabular-nums">{money(item.unit_price * item.quantity)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-5 py-3.5 bg-muted/20 font-bold">
                <span className="text-base">{t("estimatedTotal")}</span>
                <span className="text-base tabular-nums">{money(estimatedTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card premium-shadow overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30">
              <h2 className="font-bold text-base">{t("runHistory")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("runsRecorded", { count: order.runs.length })}</p>
            </div>
            {order.runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">{t("noRuns")}</div>
            ) : (
              <div className="divide-y">
                {order.runs.map((run) => (
                  <div key={run.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {run.status === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      {run.status === "error" && <XCircle className="h-4 w-4 text-red-600" />}
                      {run.status === "skipped" && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                      <span>{run.run_at ? formatDay(run.run_at, "d. MMM HH:mm", locale) : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.status === "success" && run.order_number && (
                        <span className="text-xs text-muted-foreground font-mono">{run.order_number}</span>
                      )}
                      {run.error_message && (
                        <span className="text-xs text-destructive max-w-50 truncate">{run.error_message}</span>
                      )}
                      <Badge
                        className={
                          run.status === "success"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300 text-[10px]"
                            : run.status === "error"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-400/10 dark:text-rose-300 text-[10px]"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 text-[10px]"
                        }
                      >
                        {statusLabel(run.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 h-fit">
          <div className="rounded-xl border bg-card p-5 premium-shadow space-y-4">
            <h3 className="font-bold text-base">{t("schedule")}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{freqLabel}</p>
                  <p className="text-xs text-muted-foreground">{scheduleSummary(order.frequency, order.schedule_days)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("deliveryOffset", { days: order.delivery_offset_days })}</p>
                  <p className="text-xs text-muted-foreground">{t("afterPlacement")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {order.is_active && order.next_run_at
                      ? formatDay(order.next_run_at + "T00:00:00", "EEE d. MMM", locale)
                      : t("notScheduled")}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.is_active ? t("nextRun") : t("paused")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 premium-shadow space-y-2">
            <h3 className="font-bold text-sm">{t("activePeriod")}</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("start")}</span>
              <span className="font-semibold">
                {order.start_date ? formatDay(order.start_date + "T00:00:00", "d. MMM yyyy.", locale) : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("end")}</span>
              <span className="font-semibold">
                {order.end_date ? formatDay(order.end_date + "T00:00:00", "d. MMM yyyy.", locale) : t("noEndDate")}
              </span>
            </div>
          </div>

          {order.notes && (
            <div className="rounded-xl border bg-card p-5 premium-shadow space-y-2">
              <h3 className="font-bold text-sm">{t("notes")}</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {order.created_at && (
            <p className="text-xs text-muted-foreground text-center">
              {t("created", { date: formatDay(order.created_at, "d. MMMM yyyy.", locale) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
