"use client";

import Link from "next/link";
import { useTransition, type ReactElement } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/actions/orders";
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
import { Ban, CreditCard, CheckCircle2, Truck, Package } from "lucide-react";
import type { OrderStatus } from "@/lib/supabase/types";

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

export function SupplierOrderList({ orders }: { orders: Order[] }) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orderStatus");
  const tPay = useTranslations("paymentStatus");
  const tc = useTranslations("confirm");
  const locale = useLocale() as Locale;
  const [, startTransition] = useTransition();

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("emptySupplier")}
      </div>
    );
  }

  function run(action: () => Promise<{ error?: string } | void>, ok: string) {
    startTransition(async () => {
      const r = await action();
      if (r && "error" in r && r.error) toast.error(r.error);
      else toast.success(ok);
    });
  }

  function progressButton(
    icon: ReactElement,
    label: string,
    orderId: string,
    next: OrderStatus
  ) {
    return (
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
            {icon}
            {label}
          </Button>
        }
        title={tc("statusChangeTitle")}
        description={tc("statusChangeBody")}
        confirmLabel={label}
        onConfirm={() => run(() => updateOrderStatus(orderId, next), label)}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("orderNumber")}</TableHead>
            <TableHead>{t("restaurant")}</TableHead>
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
            const isFinal = status === "cancelled" || status === "delivered";
            const canPay = payment !== "paid" && status !== "cancelled";

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/supplier/orders/${order.id}`} className="hover:underline">
                    {order.order_number}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{order.restaurant?.name ?? "-"}</TableCell>
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
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {status === "pending" &&
                      progressButton(<CheckCircle2 className="h-3 w-3" />, t("confirmOrder"), order.id, "confirmed")}
                    {(status === "confirmed" || status === "preparing") &&
                      progressButton(<Truck className="h-3 w-3" />, t("dispatch"), order.id, "dispatched")}
                    {status === "dispatched" &&
                      progressButton(<Package className="h-3 w-3" />, t("delivered"), order.id, "delivered")}

                    {canPay && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                            <CreditCard className="h-3 w-3" />
                            {t("markPaid")}
                          </Button>
                        }
                        title={tc("markPaidTitle")}
                        description={tc("markPaidBody")}
                        confirmLabel={t("markPaid")}
                        onConfirm={() => run(() => updatePaymentStatus(order.id, "paid"), t("markPaid"))}
                      />
                    )}

                    {!isFinal && (
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive">
                            <Ban className="h-3 w-3" />
                            {t("cancel")}
                          </Button>
                        }
                        title={tc("cancelOrderTitle")}
                        description={tc("cancelOrderBody")}
                        confirmLabel={t("cancel")}
                        variant="destructive"
                        onConfirm={() => run(() => updateOrderStatus(order.id, "cancelled", "Cancelled by supplier"), t("cancel"))}
                      />
                    )}

                    <Link href={`/supplier/orders/${order.id}`} className="text-xs text-muted-foreground hover:text-foreground px-2">
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
  );
}
