"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ReorderButton } from "@/components/restaurant/reorder-button";
import { Ban } from "lucide-react";

/**
 * Restaurant-side actions for one order: Reorder (always) and Cancel (while
 * the supplier hasn't started fulfilling). Used on the list rows and the
 * order detail page.
 */
export function RestaurantOrderActions({
  order,
}: {
  order: { id: string; order_number: string; status: string | null };
}) {
  const t = useTranslations("orders");
  const tc = useTranslations("confirm");
  const [, startTransition] = useTransition();

  const status = order.status ?? "pending";
  const canCancel = status === "pending" || status === "confirmed";

  function cancel() {
    startTransition(async () => {
      const r = await updateOrderStatus(
        order.id,
        "cancelled",
        t("cancelledByRestaurant")
      );
      if (r?.error) toast.error(r.error);
      else toast.success(`${t("cancel")} - ${order.order_number}`);
    });
  }

  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      <ReorderButton orderId={order.id} />
      {canCancel && (
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
            >
              <Ban className="h-3 w-3" />
              {t("cancel")}
            </Button>
          }
          title={tc("cancelOrderTitle")}
          description={tc("cancelOrderBody")}
          confirmLabel={t("cancel")}
          variant="destructive"
          onConfirm={cancel}
        />
      )}
    </div>
  );
}
