"use client";

import { useTransition, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DeclineOrderDialog } from "@/components/supplier/decline-order-dialog";
import { Ban, CreditCard, CheckCircle2, Truck, Package } from "lucide-react";
import type { OrderStatus } from "@/lib/supabase/types";

export interface ActionableOrder {
  id: string;
  order_number: string;
  status: string | null;
  payment_status: string | null;
}

/**
 * The supplier's order workflow in one place: Accept -> Dispatch -> Delivered,
 * plus Mark paid and Decline/Cancel with a structured reason. Used on both
 * the order list rows and the order detail page, so the same actions are
 * available wherever the supplier happens to be looking.
 */
export function OrderStatusActions({ order }: { order: ActionableOrder }) {
  const t = useTranslations("orders");
  const tc = useTranslations("confirm");
  const [, startTransition] = useTransition();

  const status = (order.status ?? "pending") as OrderStatus;
  const payment = order.payment_status ?? "unpaid";
  const isFinal = status === "cancelled" || status === "delivered";
  const canPay = payment !== "paid" && status !== "cancelled";

  function run(action: () => Promise<{ error?: string } | void>, ok: string) {
    startTransition(async () => {
      const r = await action();
      if (r && "error" in r && r.error) toast.error(r.error);
      else toast.success(`${ok} - ${order.order_number}`);
    });
  }

  function progressButton(icon: ReactElement, label: string, next: OrderStatus) {
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
        onConfirm={() => run(() => updateOrderStatus(order.id, next), label)}
      />
    );
  }

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      {status === "pending" &&
        progressButton(<CheckCircle2 className="h-3 w-3" />, t("accept"), "confirmed")}
      {(status === "confirmed" || status === "preparing") &&
        progressButton(<Truck className="h-3 w-3" />, t("dispatch"), "dispatched")}
      {status === "dispatched" &&
        progressButton(<Package className="h-3 w-3" />, t("delivered"), "delivered")}

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
          onConfirm={() =>
            run(() => updatePaymentStatus(order.id, "paid"), t("markPaid"))
          }
        />
      )}

      {!isFinal && (
        <DeclineOrderDialog
          orderId={order.id}
          orderNumber={order.order_number}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
            >
              <Ban className="h-3 w-3" />
              {status === "pending" ? t("decline") : t("cancel")}
            </Button>
          }
        />
      )}
    </div>
  );
}
