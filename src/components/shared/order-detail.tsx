"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
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
  placed_at: string | null;
  notes: string | null;
  order_items: OrderItem[];
}

export function OrderDetail({
  order,
  counterparty,
  counterpartyRole,
  backHref,
}: {
  order: OrderDetailData;
  counterparty: Counterparty | null;
  counterpartyRole: "supplier" | "restaurant";
  backHref: string;
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
        <div className="flex items-center gap-2">
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

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-muted/30">
            <h2 className="font-semibold text-sm">{t("items")}</h2>
          </div>
          <div className="divide-y">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate">
                    {item.product_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
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

        {/* Sidebar: meta + counterparty */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("deliveryDate")}</p>
              <p className="font-medium">{formatDay(order.delivery_date, "d. MMMM yyyy.", locale)}</p>
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
