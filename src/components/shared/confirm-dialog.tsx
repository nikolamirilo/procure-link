"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Reusable confirmation gate for destructive or state-changing actions
 * (place order, cancel, delete, mark paid, status change). onConfirm runs in a
 * transition; the dialog closes when it resolves.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  variant = "default",
  onConfirm,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      await onConfirm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button variant={variant} onClick={confirm} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
