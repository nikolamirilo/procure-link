"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getReorderItems } from "@/lib/actions/orders";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw } from "lucide-react";

/**
 * One-click repeat of a past order: loads the order's items into the cart
 * (validated against the live catalog), reports what changed, and takes the
 * user to the cart to pick a delivery date. Restaurants buy nearly the same
 * basket every week - this turns that weekly job into two clicks.
 */
export function ReorderButton({
  orderId,
  size = "sm",
  variant = "outline",
}: {
  orderId: string;
  size?: "sm" | "default";
  variant?: "outline" | "ghost" | "default";
}) {
  const t = useTranslations("orders");
  const tt = useTranslations("reorderToast");
  const { addItems } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    const r = await getReorderItems(orderId);
    setLoading(false);

    if (r?.error) {
      toast.error(r.error);
      return;
    }
    if (!r.items || r.items.length === 0) {
      toast.error(tt("allUnavailable"));
      return;
    }

    addItems(r.items);
    toast.success(tt("added", { count: r.items.length }));
    if (r.changed > 0) toast.info(tt("changed", { count: r.changed }));
    if (r.unavailable > 0) toast.warning(tt("unavailable", { count: r.unavailable }));
    router.push("/restaurant/cart");
  }

  return (
    <Button
      variant={variant}
      size={size}
      className="h-7 text-xs gap-1 px-2"
      onClick={handle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RotateCcw className="h-3 w-3" />
      )}
      {t("reorder")}
    </Button>
  );
}
