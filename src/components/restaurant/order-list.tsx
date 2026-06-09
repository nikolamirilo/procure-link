"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Ban, Repeat } from "lucide-react";

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
  const tc = useTranslations("confirm");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("emptyRestaurant")}
      </div>
    );
  }

  function cancel(orderId: string) {
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, "cancelled", "Cancelled by restaurant");
      if (r?.error) toast.error(r.error);
      else toast.success(t("cancel"));
    });
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("orderNumber")}</TableHead>
            <TableHead>{t("supplier")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("items")}</TableHead>
            <TableHead>{t("delivery")}</TableHead>
            <TableHead className="text-right">{t("total")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("payment")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = (order.status ?? "pending") as keyof typeof ORDER_STATUSES;
            const payment = (order.payment_status ?? "unpaid") as keyof typeof PAYMENT_STATUSES;
            const canCancel = status === "pending" || status === "confirmed";

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  <Link
                    href={`/restaurant/orders/${order.id}`}
                    className="flex items-center gap-1.5 hover:underline"
                  >
                    {order.order_number}
                    {order.is_auto_placed && (
                      <Badge className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0 gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />
                        {t("auto")}
                      </Badge>
                    )}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{order.supplier?.name ?? "-"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-xs text-muted-foreground max-w-[200px]">
                    {order.order_items.slice(0, 2).map((item) => (
                      <div key={item.id} className="truncate">
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
                    {canCancel && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                            disabled={pending}
                          >
                            <Ban className="h-3 w-3" />
                            {t("cancel")}
                          </Button>
                        }
                        title={tc("cancelOrderTitle")}
                        description={tc("cancelOrderBody")}
                        confirmLabel={t("cancel")}
                        variant="destructive"
                        onConfirm={() => cancel(order.id)}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
