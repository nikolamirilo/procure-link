"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";
import { createPlanInquiry } from "@/lib/actions/billing";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
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
import { Check, Loader2 } from "lucide-react";

export function PlanCards() {
  const t = useTranslations("billing");
  const locale = useLocale() as Locale;
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    const r = await createPlanInquiry(formData);
    setPending(false);
    if (r?.error) toast.error(r.error);
    else {
      toast.success(t("inquirySent"));
      setOpenCode(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
      {PLANS.map((plan) => (
        <div key={plan.code} className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-1">
              <span className="text-2xl font-bold tabular-nums">
                {formatMoney(plan.priceRsd, "RSD", locale)}
              </span>
              <span className="text-muted-foreground text-sm"> / {t("perMonth")}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(plan.priceEur, "EUR", locale)} / {t("perMonth")}
            </p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {plan.featureKeys.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {t(key)}
              </li>
            ))}
          </ul>
          <Dialog open={openCode === plan.code} onOpenChange={(o) => setOpenCode(o ? plan.code : null)}>
            <DialogTrigger
              render={<Button className="w-full">{t("getPlan")}</Button>}
            />
            <DialogContent>
              <form action={submit}>
                <input type="hidden" name="planCode" value={plan.code} />
                <DialogHeader>
                  <DialogTitle>{t("inquiryTitle")} - {plan.name}</DialogTitle>
                  <DialogDescription>{t("inquiryBody")}</DialogDescription>
                </DialogHeader>
                <div className="py-3">
                  <Textarea name="message" rows={3} placeholder={t("message")} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={pending} className="gap-2">
                    {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("send")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ))}
    </div>
  );
}
