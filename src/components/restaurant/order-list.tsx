"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { RestaurantOrderActions } from "@/components/restaurant/order-actions";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Repeat, ArrowRight } from "lucide-react";

const PAGE_SIZE = 25;

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
  payment_status: string | null;
  delivery_date: string;
  placed_at: string | null;
  notes: string | null;
  is_auto_placed: boolean;
  order_items: OrderItem[];
  supplier: { name: string } | null;
}

export function RestaurantOrderList({ orders }: { orders: Order[] }) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orderStatus");
  const tPay = useTranslations("paymentStatus");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [filter, setFilter] = useState<OrderStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      orders.filter((o) =>
        matchesOrderFilters(o, o.supplier?.name ?? "", filter, search)
      ),
    [orders, filter, search]
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">{t("emptyRestaurant")}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/restaurant/browse")}>
          {t("browseCta")}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
    );
  }

  function statusBadges(order: Order) {
    const status = (order.status ?? "pending") as keyof typeof ORDER_STATUSES;
    const payment = (order.payment_status ?? "unpaid") as keyof typeof PAYMENT_STATUSES;
    return (
      <>
        <Badge className={ORDER_STATUSES[status].color + " text-xs"}>
          {tStatus(status)}
        </Badge>
        <Badge className={PAYMENT_STATUSES[payment].color + " text-xs"}>
          {tPay(payment)}
        </Badge>
      </>
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
                  <TableHead>{t("supplier")}</TableHead>
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
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/restaurant/orders/${order.id}`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          {order.order_number}
                          {order.is_auto_placed && (
                            <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-300 text-[9px] px-1.5 py-0 gap-0.5">
                              <Repeat className="h-2.5 w-2.5" />
                              {t("auto")}
                            </Badge>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{order.supplier?.name ?? "-"}</TableCell>
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
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/restaurant/orders/${order.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground px-2"
                          >
                            {t("view")}
                          </Link>
                          <RestaurantOrderActions
                            order={{
                              id: order.id,
                              order_number: order.order_number,
                              status: order.status,
                            }}
                          />
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
            {visible.map((order) => (
              <div key={order.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/restaurant/orders/${order.id}`}
                    className="font-mono text-xs font-medium hover:underline flex items-center gap-1.5"
                  >
                    {order.order_number}
                    {order.is_auto_placed && (
                      <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-300 text-[9px] px-1.5 py-0 gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />
                        {t("auto")}
                      </Badge>
                    )}
                  </Link>
                  <span className="text-sm font-bold tabular-nums shrink-0">
                    {formatMoney(order.total, order.currency, locale)}
                  </span>
                </div>
                <div className="text-sm">{order.supplier?.name ?? "-"}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDay(order.delivery_date, "d. MMM yyyy.", locale)}
                  </span>
                  <div className="flex items-center gap-1.5">{statusBadges(order)}</div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t">
                  <Link
                    href={`/restaurant/orders/${order.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("view")}
                  </Link>
                  <RestaurantOrderActions
                    order={{
                      id: order.id,
                      order_number: order.order_number,
                      status: order.status,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <ListPagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
