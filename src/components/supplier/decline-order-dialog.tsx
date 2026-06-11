"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/actions/orders";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const REASON_KEYS = ["outOfStock", "belowMin", "badDate", "other"] as const;

/**
 * Decline (cancel) an order with a structured reason. The reason is stored on
 * the order, shown to the restaurant on the order detail page, and included
 * in the cancellation notification - "Cancelled by supplier" with no
 * explanation just creates a phone call.
 */
export function DeclineOrderDialog({
  orderId,
  orderNumber,
  trigger,
  onDone,
}: {
  orderId: string;
  orderNumber: string;
  trigger: ReactElement;
  onDone?: () => void;
}) {
  const t = useTranslations("declineDialog");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reasonKey, setReasonKey] = useState<(typeof REASON_KEYS)[number]>("outOfStock");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const reason = [t(reasonKey), note.trim()].filter(Boolean).join(" - ");
      const r = await updateOrderStatus(orderId, "cancelled", reason);
      if (r?.error) {
        toast.error(r.error);
      } else {
        toast.success(`${t("submit")} - ${orderNumber}`);
        setOpen(false);
        setNote("");
        onDone?.();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("title")} - {orderNumber}
          </DialogTitle>
          <DialogDescription>{t("body")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("reasonLabel")}</Label>
            <Select
              value={reasonKey}
              onValueChange={(v) => v && setReasonKey(v as (typeof REASON_KEYS)[number])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {tc("cancel")}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
