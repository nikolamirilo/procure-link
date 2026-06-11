"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { createClient } from "@/lib/supabase/client";
import { placeOrder } from "@/lib/actions/orders";
import { DeliveryDatePicker } from "@/components/restaurant/delivery-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Repeat,
  Info,
  TriangleAlert,
} from "lucide-react";

interface SupplierMeta {
  minOrderValue: number;
  leadTimeHours: number;
}

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    getSupplierIds,
    getSupplierItems,
    clearCart,
    clearSupplierItems,
  } = useCart();
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
  const [deliveryTimes, setDeliveryTimes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [deliveryDaysMap, setDeliveryDaysMap] = useState<Record<string, number[]>>({});
  const [supplierMeta, setSupplierMeta] = useState<Record<string, SupplierMeta>>({});
  const router = useRouter();

  const supplierIds = getSupplierIds();

  // Load each supplier's delivery weekdays + ordering constraints (min order
  // value, lead time) so the cart surfaces them at the moment of decision.
  useEffect(() => {
    const ids = getSupplierIds();
    if (ids.length === 0) return;
    const supabase = createClient();
    (async () => {
      const [slotsRes, companiesRes] = await Promise.all([
        supabase
          .from("delivery_slots")
          .select("supplier_id, day_of_week")
          .in("supplier_id", ids)
          .eq("is_active", true),
        supabase
          .from("companies")
          .select("id, min_order_value, lead_time_hours")
          .in("id", ids),
      ]);

      const map: Record<string, number[]> = {};
      for (const row of slotsRes.data ?? []) {
        (map[row.supplier_id] ??= []).push(row.day_of_week);
      }
      for (const k of Object.keys(map)) map[k] = [...new Set(map[k])];
      setDeliveryDaysMap(map);

      const meta: Record<string, SupplierMeta> = {};
      for (const c of companiesRes.data ?? []) {
        meta[c.id] = {
          minOrderValue: Number(c.min_order_value ?? 0),
          leadTimeHours: Number(c.lead_time_hours ?? 0),
        };
      }
      setSupplierMeta(meta);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function supplierSubtotal(supplierId: string): number {
    return getSupplierItems(supplierId).reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0
    );
  }

  /** Total promo savings for one supplier's items (0 = no offers in group). */
  function supplierSavings(supplierId: string): number {
    return getSupplierItems(supplierId).reduce(
      (sum, i) =>
        sum + (i.originalUnitPrice ? (i.originalUnitPrice - i.unitPrice) * i.quantity : 0),
      0
    );
  }

  /** Suppliers whose subtotal is still under their published minimum. */
  const belowMinSuppliers = supplierIds.filter((sid) => {
    const min = supplierMeta[sid]?.minOrderValue ?? 0;
    return min > 0 && supplierSubtotal(sid) < min;
  });

  function saveAsRecurring(supplierId: string) {
    // Stateless handoff: the automation form receives the items and supplier
    // via the URL and nothing is written to the database until the user saves.
    const supplierItems = getSupplierItems(supplierId);
    const data = encodeURIComponent(
      JSON.stringify(
        supplierItems.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      )
    );
    const params = new URLSearchParams();
    params.set("supplier", supplierId);
    if (deliveryDates[supplierId]) params.set("date", deliveryDates[supplierId]);
    router.push(`/restaurant/automations/new?data=${data}&${params.toString()}`);
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <div className="text-center py-20 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium text-lg">{t("empty")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
          <Button variant="outline" className="mt-2" onClick={() => router.push("/restaurant/browse")}>
            {t("browse")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  function validateDates(): boolean {
    for (const sid of supplierIds) {
      if (!deliveryDates[sid]) {
        setError(t("selectDate", { name: getSupplierItems(sid)[0]?.supplierName ?? "" }));
        return false;
      }
    }
    return true;
  }

  async function handlePlaceAllOrders() {
    setError(null);
    if (!validateDates()) return;

    setLoading(true);
    const errors: string[] = [];
    let placedAny = false;

    // Place sequentially, one order per supplier. Each success immediately
    // removes that supplier's items from the cart, so a retry after a partial
    // failure can never re-place (and duplicate) the successful orders.
    for (const supplierId of [...supplierIds]) {
      const supplierItems = getSupplierItems(supplierId);
      if (supplierItems.length === 0) continue;

      const result = await placeOrder({
        supplierId,
        deliverySlotId: null,
        deliveryDate: deliveryDates[supplierId],
        deliveryTime: deliveryTimes[supplierId] || "",
        idempotencyKey: crypto.randomUUID(),
        notes: notes[supplierId] || "",
        items: supplierItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (result?.error) {
        errors.push(`${supplierItems[0]?.supplierName}: ${result.error}`);
      } else {
        placedAny = true;
        clearSupplierItems(supplierId);
        if (result && "orderNumber" in result && result.orderNumber) {
          toast.success(t("orderPlaced", { number: String(result.orderNumber) }));
        }
      }
    }

    setLoading(false);

    if (errors.length > 0) {
      setError(
        (placedAny ? t("partialFailure") + " " : "") + errors.join(". ")
      );
    } else {
      router.push("/restaurant/orders");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("itemsFrom", { items: items.length, suppliers: supplierIds.length })}
          </p>
        </div>
        <ConfirmDialog
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive shrink-0">
              <Trash2 className="h-4 w-4" />
              {t("clearCart")}
            </Button>
          }
          title={t("clearCartTitle")}
          description={t("clearCartBody")}
          confirmLabel={t("clearCart")}
          variant="destructive"
          onConfirm={() => clearCart()}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {supplierIds.map((supplierId) => {
            const supplierItems = getSupplierItems(supplierId);
            const supplierName = supplierItems[0]?.supplierName ?? "";
            const currency = supplierItems[0]?.currency ?? "RSD";
            const subtotal = supplierSubtotal(supplierId);
            const meta = supplierMeta[supplierId];
            const minOrder = meta?.minOrderValue ?? 0;
            const leadTime = meta?.leadTimeHours ?? 0;
            const belowMin = minOrder > 0 && subtotal < minOrder;

            return (
              <div key={supplierId} className="rounded-xl border bg-card premium-shadow overflow-hidden">
                <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm" title={supplierName}>{supplierName}</h3>
                    <span className="text-[11px] text-muted-foreground">({supplierItems.length})</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums">{formatMoney(subtotal, currency, locale)}</span>
                </div>

                {/* Ordering constraints, surfaced where the decision happens */}
                {(minOrder > 0 || leadTime > 0) && (
                  <div className="px-4 py-2 border-b bg-muted/10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {minOrder > 0 && t("minOrderLabel", { amount: formatMoney(minOrder, currency, locale) })}
                      {minOrder > 0 && leadTime > 0 && " · "}
                      {leadTime > 0 && t("leadTimeNote", { hours: leadTime })}
                    </span>
                  </div>
                )}

                <div className="divide-y">
                  {supplierItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate" title={item.productName}>
                          {item.productName}
                          {item.discountPct ? (
                            <span className="ml-1.5 rounded-full bg-red-600 text-white text-[9px] font-black px-1.5 py-px align-middle">
                              -{item.discountPct}%
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.originalUnitPrice ? (
                            <span className="line-through mr-1 tabular-nums">
                              {formatMoney(item.originalUnitPrice, item.currency, locale)}
                            </span>
                          ) : null}
                          {formatMoney(item.unitPrice, item.currency, locale)} / {item.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="w-24 text-right font-semibold text-xs shrink-0 tabular-nums">
                        {formatMoney(item.unitPrice * item.quantity, item.currency, locale)}
                      </span>

                      <button
                        className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer p-0.5 transition-colors"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {supplierSavings(supplierId) > 0 && (
                  <div className="px-4 py-2 border-t bg-red-50 dark:bg-red-950/20 text-xs font-semibold text-red-700 dark:text-red-400 text-right tabular-nums">
                    {t("youSave", {
                      amount: formatMoney(supplierSavings(supplierId), currency, locale),
                    })}
                  </div>
                )}

                {belowMin && (
                  <div className="px-4 py-2.5 border-t bg-amber-50 dark:bg-amber-950/30 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0" />
                    {t("belowMin", {
                      missing: formatMoney(minOrder - subtotal, currency, locale),
                      name: supplierName,
                      amount: formatMoney(minOrder, currency, locale),
                    })}
                  </div>
                )}

                <div className="px-4 py-3 border-t bg-muted/10 flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-[11px] text-muted-foreground">
                      {t("deliveryDateFor", { name: supplierName })}
                    </Label>
                    <div className="mt-1">
                      <DeliveryDatePicker
                        value={deliveryDates[supplierId] ?? ""}
                        onChange={(v) => setDeliveryDates((prev) => ({ ...prev, [supplierId]: v }))}
                        availableDays={deliveryDaysMap[supplierId] ?? []}
                        leadTimeHours={leadTime}
                      />
                    </div>
                  </div>
                  <div className="min-w-30">
                    <Label className="text-[11px] text-muted-foreground">{t("deliveryTime")}</Label>
                    <Input
                      type="time"
                      className="h-9 text-sm mt-1 cursor-pointer"
                      value={deliveryTimes[supplierId] ?? ""}
                      onChange={(e) => setDeliveryTimes((prev) => ({ ...prev, [supplierId]: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-[11px] text-muted-foreground">{t("notesOptional")}</Label>
                    <Input
                      className="h-9 text-sm mt-1"
                      value={notes[supplierId] ?? ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [supplierId]: e.target.value }))}
                      placeholder={t("notesPlaceholder")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => saveAsRecurring(supplierId)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-medium hover:bg-muted cursor-pointer transition-colors shrink-0"
                  >
                    <Repeat className="h-3 w-3" />
                    {t("saveAsRecurring")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="sticky top-6 rounded-xl border bg-card p-4 premium-shadow space-y-4">
            <h3 className="font-semibold text-sm">{t("summary")}</h3>
            <div className="space-y-2 text-sm">
              {supplierIds.map((sid) => {
                const si = getSupplierItems(sid);
                const name = si[0]?.supplierName ?? "";
                const currency = si[0]?.currency ?? "RSD";
                const total = si.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
                return (
                  <div key={sid} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2 text-xs" title={name}>
                      {name} <span className="text-muted-foreground/60">({si.length})</span>
                    </span>
                    <span className="font-medium shrink-0 tabular-nums text-xs">
                      {formatMoney(total, currency, locale)}
                    </span>
                  </div>
                );
              })}
            </div>
            <Separator />

            {supplierIds.length > 1 && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("splitNote", { count: supplierIds.length })}
              </p>
            )}

            {belowMinSuppliers.length > 0 && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-1.5">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {t("belowMin", {
                  missing: formatMoney(
                    (supplierMeta[belowMinSuppliers[0]]?.minOrderValue ?? 0) -
                      supplierSubtotal(belowMinSuppliers[0]),
                    getSupplierItems(belowMinSuppliers[0])[0]?.currency ?? "RSD",
                    locale
                  ),
                  name: getSupplierItems(belowMinSuppliers[0])[0]?.supplierName ?? "",
                  amount: formatMoney(
                    supplierMeta[belowMinSuppliers[0]]?.minOrderValue ?? 0,
                    getSupplierItems(belowMinSuppliers[0])[0]?.currency ?? "RSD",
                    locale
                  ),
                })}
              </p>
            )}

            <Button
              className="w-full h-10 font-semibold"
              onClick={handlePlaceAllOrders}
              disabled={loading || belowMinSuppliers.length > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("placing")}
                </>
              ) : supplierIds.length > 1 ? (
                t("placeOrders")
              ) : (
                t("placeOrder")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
