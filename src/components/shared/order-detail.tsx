"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Phone, Mail, MapPin, Ban, Clock } from "lucide-react";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  original_unit_price?: number | null;
  discount_pct?: number | null;
  total_price: number;
}

interface Counterparty {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface OrderDetailData {
  order_number: string;
  status: string | null;
  payment_status: string | null;
  currency: string;
  subtotal: number;
  commission_amt: number;
  total: number;
  delivery_date: string;
  delivery_time?: string | null;
  placed_at: string | null;
  confirmed_at?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  notes: string | null;
  order_items: OrderItem[];
}

/** Vertical status history: what happened and when. */
function Timeline({ order }: { order: OrderDetailData }) {
  const t = useTranslations("orderDetail");
  const tStatus = useTranslations("orderStatus");
  const locale = useLocale() as Locale;

  const steps: { key: string; label: string; at: string | null | undefined; reached: boolean }[] = [
    { key: "pending", label: tStatus("pending"), at: order.placed_at, reached: !!order.placed_at },
    { key: "confirmed", label: tStatus("confirmed"), at: order.confirmed_at, reached: !!order.confirmed_at },
    { key: "dispatched", label: tStatus("dispatched"), at: order.dispatched_at, reached: !!order.dispatched_at },
    { key: "delivered", label: tStatus("delivered"), at: order.delivered_at, reached: !!order.delivered_at },
  ];
  if (order.cancelled_at) {
    // A cancelled order's path ends at cancellation - drop unreached steps.
    const reached = steps.filter((s) => s.reached);
    reached.push({
      key: "cancelled",
      label: tStatus("cancelled"),
      at: order.cancelled_at,
      reached: true,
    });
    return <TimelineList steps={reached} locale={locale} title={t("timeline")} cancelled />;
  }
  return <TimelineList steps={steps} locale={locale} title={t("timeline")} />;
}

function TimelineList({
  steps,
  locale,
  title,
  cancelled = false,
}: {
  steps: { key: string; label: string; at: string | null | undefined; reached: boolean }[];
  locale: Locale;
  title: string;
  cancelled?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 text-sm">
      <p className="text-xs text-muted-foreground mb-3">{title}</p>
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isCancelStep = cancelled && isLast;
          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[5px] top-4 bottom-0 w-px bg-border"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative h-[11px] w-[11px] rounded-full border-2 shrink-0 mt-1",
                  isCancelStep
                    ? "bg-red-500 border-red-500"
                    : step.reached
                    ? "bg-primary border-primary"
                    : "bg-background border-muted-foreground/30"
                )}
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-medium leading-tight",
                    !step.reached && "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </p>
                {step.at && (
                  <p className="text-[10px] text-muted-foreground">
                    {formatDay(step.at, "d. MMM yyyy. HH:mm", locale)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function OrderDetail({
  order,
  counterparty,
  counterpartyRole,
  backHref,
  actions,
}: {
  order: OrderDetailData;
  counterparty: Counterparty | null;
  counterpartyRole: "supplier" | "restaurant";
  backHref: string;
  /** Role-specific action buttons (status workflow, reorder, cancel). */
  actions?: ReactNode;
}) {
  const t = useTranslations("orderDetail");
  const tStatus = useTranslations("orderStatus");
  const tPay = useTranslations("paymentStatus");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, order.currency, locale);

  const statusKey = (order.status ?? "pending") as keyof typeof ORDER_STATUSES;
  const payKey = (order.payment_status ??
    "unpaid") as keyof typeof PAYMENT_STATUSES;

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToOrders")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t("orderNumber")}</p>
          <h1 className="text-2xl font-bold tracking-tight tabular-nums">
            {order.order_number}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              ORDER_STATUSES[statusKey]?.color
            )}
          >
            {tStatus(statusKey)}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              PAYMENT_STATUSES[payKey]?.color
            )}
          >
            {tPay(payKey)}
          </span>
        </div>
      </div>

      {/* Role-specific actions, right where the user reads the order */}
      {actions && <div className="flex justify-end">{actions}</div>}

      {/* Cancellation reason - the restaurant should never have to call to ask why */}
      {order.status === "cancelled" && order.cancel_reason && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <Ban className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t("cancelReason")}</p>
            <p>{order.cancel_reason}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <div className="rounded-xl border bg-card overflow-hidden self-start">
          <div className="px-4 py-2.5 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">{t("items")}</h2>
          </div>
          <div className="divide-y">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate" title={item.product_name}>
                    {item.product_name}
                    {item.discount_pct ? (
                      <span className="ml-1.5 rounded-full bg-red-600 text-white text-[9px] font-black px-1.5 py-px align-middle">
                        -{Number(item.discount_pct)}%
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.original_unit_price ? (
                      <span className="line-through mr-1 tabular-nums">
                        {money(Number(item.original_unit_price))}
                      </span>
                    ) : null}
                    {money(item.unit_price)} / {item.unit}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {item.quantity} {item.unit}
                </span>
                <span className="w-24 text-right font-semibold text-xs shrink-0 tabular-nums">
                  {money(item.total_price)}
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t bg-muted/10 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("subtotal")}</span>
              <span className="tabular-nums">{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("commission")}</span>
              <span className="tabular-nums">{money(order.commission_amt)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1.5 border-t">
              <span>{t("total")}</span>
              <span className="tabular-nums">{money(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar: meta + timeline + counterparty */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("deliveryDate")}</p>
              <p className="font-medium">
                {formatDay(order.delivery_date, "d. MMMM yyyy.", locale)}
              </p>
              {order.delivery_time && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {t("deliveryTime")}: {order.delivery_time.slice(0, 5)}
                </p>
              )}
            </div>
            {order.placed_at && (
              <div>
                <p className="text-xs text-muted-foreground">{t("placedAt")}</p>
                <p className="font-medium">{formatDay(order.placed_at, "d. MMM yyyy.", locale)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{t("notes")}</p>
              <p className="text-sm">{order.notes || t("noNotes")}</p>
            </div>
          </div>

          <Timeline order={order} />

          {counterparty && (
            <div className="rounded-xl border bg-card p-4 space-y-2 text-sm">
              <p className="text-xs text-muted-foreground">
                {t(counterpartyRole)}
              </p>
              <p className="font-semibold">{counterparty.name}</p>
              {counterparty.phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {counterparty.phone}
                </p>
              )}
              {counterparty.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {counterparty.email}
                </p>
              )}
              {(counterparty.address || counterparty.city) && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {[counterparty.address, counterparty.city]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
