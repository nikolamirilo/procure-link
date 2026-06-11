"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderListToolbar,
  ListPagination,
  matchesOrderFilters,
  type OrderStatusFilter,
} from "@/components/shared/order-list-toolbar";
import { OrderStatusActions } from "@/components/supplier/order-status-actions";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { ArrowRight } from "lucide-react";

const PAGE_SIZE = 25;
const NEW_ORDER_WINDOW_MS = 24 * 60 * 60 * 1000;

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string | null;
  currency: string;
  subtotal: number;
  total: number;
  commission_amt: number;
  payment_status: string | null;
  delivery_date: string;
  placed_at: string | null;
  notes: string | null;
  order_items: OrderItem[];
  restaurant: { name: string } | null;
}

/** Pending orders placed in the last 24h get a "New" chip + row accent. */
function isNewOrder(order: Order): boolean {
  return (
    (order.status ?? "pending") === "pending" &&
    !!order.placed_at &&
    Date.now() - new Date(order.placed_at).getTime() < NEW_ORDER_WINDOW_MS
  );
}

export function SupplierOrderList({ orders }: { orders: Order[] }) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orderStatus");
  const tPay = useTranslations("paymentStatus");
  const locale = useLocale() as Locale;

  const [filter, setFilter] = useState<OrderStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pendingCount = useMemo(
    () => orders.filter((o) => (o.status ?? "pending") === "pending").length,
    [orders]
  );

  // A supplier's list is a work queue: within the current filter, pending
  // first (oldest at the top - first in, first served), then the rest by
  // recency.
  const filtered = useMemo(() => {
    const list = orders.filter((o) =>
      matchesOrderFilters(o, o.restaurant?.name ?? "", filter, search)
    );
    return [...list].sort((a, b) => {
      const aPending = (a.status ?? "pending") === "pending" ? 0 : 1;
      const bPending = (b.status ?? "pending") === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      const aTime = a.placed_at ? new Date(a.placed_at).getTime() : 0;
      const bTime = b.placed_at ? new Date(b.placed_at).getTime() : 0;
      return aPending === 0 ? aTime - bTime : bTime - aTime;
    });
  }, [orders, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">{t("emptySupplier")}</p>
        {/* Restaurants can only order what's in the catalog - point there */}
        <Link
          href="/supplier/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {t("addProductCta")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderListToolbar
        filter={filter}
        onFilterChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        search={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        pendingCount={pendingCount}
      />

      {filtered.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">{t("noMatches")}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderNumber")}</TableHead>
                  <TableHead>{t("restaurant")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("items")}</TableHead>
                  <TableHead>{t("delivery")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("payment")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((order) => {
                  const status = (order.status ?? "pending") as keyof typeof ORDER_STATUSES;
                  const payment = (order.payment_status ?? "unpaid") as keyof typeof PAYMENT_STATUSES;
                  const isNew = isNewOrder(order);

                  return (
                    <TableRow
                      key={order.id}
                      className={isNew ? "border-l-2 border-l-primary bg-primary/[0.03]" : undefined}
                    >
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/supplier/orders/${order.id}`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          {order.order_number}
                          {isNew && (
                            <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                              {t("newBadge")}
                            </Badge>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{order.restaurant?.name ?? "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs text-muted-foreground max-w-[200px]">
                          {order.order_items.slice(0, 2).map((item) => (
                            <div key={item.id} className="truncate" title={item.product_name}>
                              {item.quantity}x {item.product_name}
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <span className="text-muted-foreground/60">
                              {t("more", { count: order.order_items.length - 2 })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDay(order.delivery_date, "d. MMM yyyy.", locale)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatMoney(order.total, order.currency, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge className={ORDER_STATUSES[status].color + " text-xs"}>
                          {tStatus(status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_STATUSES[payment].color + " text-xs"}>
                          {tPay(payment)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          <OrderStatusActions
                            order={{
                              id: order.id,
                              order_number: order.order_number,
                              status: order.status,
                              payment_status: order.payment_status,
                            }}
                          />
                          <Link
                            href={`/supplier/orders/${order.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground px-2"
                          >
                            {t("view")}
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {visible.map((order) => {
              const status = (order.status ?? "pending") as keyof typeof ORDER_STATUSES;
              const payment = (order.payment_status ?? "unpaid") as keyof typeof PAYMENT_STATUSES;
              const isNew = isNewOrder(order);
              return (
                <div
                  key={order.id}
                  className={`rounded-xl border bg-card p-4 space-y-3 ${
                    isNew ? "border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/supplier/orders/${order.id}`}
                      className="font-mono text-xs font-medium hover:underline flex items-center gap-1.5"
                    >
                      {order.order_number}
                      {isNew && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                          {t("newBadge")}
                        </Badge>
                      )}
                    </Link>
                    <span className="text-sm font-bold tabular-nums shrink-0">
                      {formatMoney(order.total, order.currency, locale)}
                    </span>
                  </div>
                  <div className="text-sm">{order.restaurant?.name ?? "-"}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDay(order.delivery_date, "d. MMM yyyy.", locale)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge className={ORDER_STATUSES[status].color + " text-xs"}>
                        {tStatus(status)}
                      </Badge>
                      <Badge className={PAYMENT_STATUSES[payment].color + " text-xs"}>
                        {tPay(payment)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t gap-2">
                    <Link
                      href={`/supplier/orders/${order.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {t("view")}
                    </Link>
                    <OrderStatusActions
                      order={{
                        id: order.id,
                        order_number: order.order_number,
                        status: order.status,
                        payment_status: order.payment_status,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <ListPagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
