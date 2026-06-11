"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { createOffer, deleteOffer, toggleOffer } from "@/lib/actions/delivery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Tag, Clock, Loader2, Pause, Play } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { applyDiscount } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";

interface Offer {
  id: string;
  product_id: string;
  discount_pct: number;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  products: { id: string; name: string; price: number; supplier_id: string } | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

type OfferState = "active" | "scheduled" | "expired" | "paused";

export function OfferList({
  offers,
  products,
  currency = "RSD",
}: {
  offers: Offer[];
  products: Product[];
  currency?: string;
}) {
  const t = useTranslations("offers");
  const locale = useLocale() as Locale;
  const [productId, setProductId] = useState("");
  const [previewPct, setPreviewPct] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const validOffers = offers.filter((o) => o.products !== null);
  const now = new Date();
  const money = (n: number) => formatMoney(n, currency, locale);

  const selectedProduct = products.find((p) => p.id === productId);

  function offerState(offer: Offer): OfferState {
    if (offer.is_active === false) return "paused";
    if (new Date(offer.end_date + "T23:59:59") < now) return "expired";
    if (new Date(offer.start_date) > now) return "scheduled";
    return "active";
  }

  const stateBadge: Record<OfferState, { label: string; cls: string }> = {
    active: { label: t("active"), cls: "bg-white/20 text-white border-white/30 backdrop-blur-sm" },
    scheduled: { label: t("scheduled"), cls: "bg-white/60 text-foreground/70" },
    expired: { label: t("expired"), cls: "bg-white/60 text-foreground/60" },
    paused: { label: t("paused"), cls: "bg-white/60 text-foreground/60" },
  };

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("productId", productId);
    const result = await createOffer(formData);
    if (result?.error) setError(result.error);
    setLoading(false);
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteOffer(id);
      if (r?.error) toast.error(r.error);
    });
  }

  function togglePaused(offer: Offer) {
    startTransition(async () => {
      const r = await toggleOffer(offer.id, offer.is_active === false);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <Dialog>
        <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-semibold h-10 px-5 cursor-pointer hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          {t("createOffer")}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newPromotion")}</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("product")}</Label>
              <Select value={productId} onValueChange={(v) => v && setProductId(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder={t("selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({money(p.price)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPct">{t("discountPct")}</Label>
              <Input
                id="discountPct"
                name="discountPct"
                type="number"
                step="0.5"
                min="1"
                max="95"
                placeholder="10"
                className="h-11"
                onChange={(e) => setPreviewPct(Number(e.target.value) || 0)}
                required
              />
            </div>

            {/* Live preview: what restaurants will see and pay */}
            {selectedProduct && previewPct > 0 && previewPct <= 95 && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm flex items-center justify-between">
                <span className="text-muted-foreground">{t("preview")}</span>
                <span className="tabular-nums">
                  <span className="line-through text-muted-foreground mr-2">
                    {money(selectedProduct.price)}
                  </span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {money(applyDiscount(selectedProduct.price, previewPct))}
                  </span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t("startDate")}</Label>
                <Input id="startDate" name="startDate" type="date" className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <Input id="endDate" name="endDate" type="date" className="h-11" required />
              </div>
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full h-11 font-semibold gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? t("creating") : t("createOffer")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {validOffers.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {validOffers.map((offer) => {
            const state = offerState(offer);
            const isActive = state === "active";
            const originalPrice = offer.products?.price ?? 0;
            const discountedPrice = applyDiscount(originalPrice, offer.discount_pct);
            const daysLeft = Math.ceil(
              (new Date(offer.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            const badge = stateBadge[state];

            return (
              <div key={offer.id} className="group relative rounded-2xl border bg-card premium-shadow overflow-hidden transition-all duration-300 hover:premium-shadow-lg hover:-translate-y-0.5">
                <div className={`relative h-28 flex items-center justify-center ${isActive ? "bg-gradient-to-br from-primary via-primary/90 to-brand-700" : "bg-gradient-to-br from-muted-foreground/30 via-muted-foreground/20 to-muted-foreground/10"}`}>
                  <div className="text-center">
                    <div className="text-4xl font-black text-white tracking-tight">{offer.discount_pct}%</div>
                    <div className="text-white/80 text-sm font-medium">{t("off")}</div>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className={badge.cls}>{badge.label}</Badge>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-1">
                    {state !== "expired" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/20"
                        title={state === "paused" ? t("resume") : t("pause")}
                        onClick={() => togglePaused(offer)}
                      >
                        {state === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/20" title={t("deleteTitle")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title={t("deleteTitle")}
                      description={t("deleteBody")}
                      confirmLabel={t("deleteTitle")}
                      variant="destructive"
                      onConfirm={() => remove(offer.id)}
                    />
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold text-[15px]">{offer.products?.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-lg font-bold text-primary">{money(discountedPrice)}</span>
                      <span className="text-sm text-muted-foreground line-through">{money(originalPrice)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(offer.start_date).toLocaleDateString()} - {new Date(offer.end_date).toLocaleDateString()}
                    </span>
                    {isActive && daysLeft > 0 && (
                      <Badge variant="outline" className="text-[10px] font-medium">{t("daysLeft", { days: daysLeft })}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
