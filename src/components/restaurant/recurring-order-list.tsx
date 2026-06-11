"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  toggleRecurringOrder,
  deleteRecurringOrder,
} from "@/lib/actions/recurring-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDay } from "@/lib/format";
import { AUTOMATION_STATUSES } from "@/lib/constants";
import type { Locale } from "@/i18n/config";
import {
  Repeat,
  Pause,
  Play,
  Trash2,
  ChevronRight,
  CalendarClock,
} from "lucide-react";

interface RecurringOrder {
  id: string;
  name: string;
  frequency: string;
  schedule_days: number[] | unknown;
  delivery_offset_days: number;
  is_active: boolean;
  next_run_at: string | null;
  supplier_name: string;
  item_count: number;
}

export function RecurringOrderList({ orders }: { orders: RecurringOrder[] }) {
  const t = useTranslations("recurring");
  const td = useTranslations("days");
  const tv = useTranslations("orders");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  function scheduleSummary(frequency: string, days: number[]): string {
    if (frequency === "daily") return t("everyDay");
    if (!days || days.length === 0) return t("notConfigured");
    if (frequency === "weekly") return days.map((d) => td(String(d))).join(", ");
    return days.map((d) => `${d}.`).join(", ") + t("ofEachMonth");
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Repeat className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">{t("emptyTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
      </div>
    );
  }

  function toggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const r = await toggleRecurringOrder(id, !isActive);
      if (r?.error) toast.error(r.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteRecurringOrder(id);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => {
        const days = Array.isArray(order.schedule_days) ? (order.schedule_days as number[]) : [];
        return (
          <div key={order.id} className="rounded-2xl border bg-card premium-shadow hover:premium-shadow-lg transition-all duration-300 overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] truncate">{order.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.supplier_name}</p>
                </div>
                <Badge
                  className={
                    (order.is_active
                      ? AUTOMATION_STATUSES.active.color
                      : AUTOMATION_STATUSES.paused.color) + " text-[10px] shrink-0"
                  }
                >
                  {order.is_active ? t("active") : t("paused")}
                </Badge>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">{scheduleSummary(order.frequency, days)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t("itemsCount", { count: order.item_count })} · {t("deliveryOffset", { days: order.delivery_offset_days })}
                  </span>
                  {order.next_run_at && order.is_active && (
                    <span className="text-muted-foreground">
                      {t("nextColon")} {formatDay(order.next_run_at + "T00:00:00", "d. MMM", locale)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <Link href={`/restaurant/automations/${order.id}`} className="flex-1 inline-flex items-center justify-center h-8 rounded-lg border text-xs font-medium hover:bg-muted cursor-pointer transition-colors gap-1">
                  {tv("view")}
                  <ChevronRight className="h-3 w-3" />
                </Link>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 px-2.5" disabled={pending} onClick={() => toggle(order.id, order.is_active)}>
                  {order.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {order.is_active ? t("pause") : t("resume")}
                </Button>
                <ConfirmDialog
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                  title={t("deleteTitle")}
                  description={t("deleteListBody")}
                  confirmLabel={t("delete")}
                  variant="destructive"
                  onConfirm={() => remove(order.id)}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
