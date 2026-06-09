"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  createRecurringOrder,
  updateRecurringOrder,
} from "@/lib/actions/recurring-orders";
import { ScheduleConfigurator } from "./schedule-configurator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Minus, Plus, Trash2, Loader2, Search, Package } from "lucide-react";

interface ItemData {
  productId: string;
  productName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

interface AvailableProduct {
  id: string;
  name: string;
  unit: string;
  price: number;
  min_order_qty: number | null;
  supplier_id: string;
}

interface RecurringOrderFormProps {
  suppliers: { id: string; name: string }[];
  products?: AvailableProduct[];
  currency?: string;
  existingOrder?: {
    id: string;
    name: string;
    supplier_id: string;
    frequency: string;
    schedule_days: number[];
    delivery_offset_days: number;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    items: ItemData[];
  };
  initialItems?: (ItemData & { supplierId: string; supplierName: string })[];
}

export function RecurringOrderForm({
  suppliers,
  products = [],
  currency = "RSD",
  existingOrder,
  initialItems,
}: RecurringOrderFormProps) {
  const router = useRouter();
  const t = useTranslations("recurringForm");
  const tr = useTranslations("recurring");
  const locale = useLocale() as Locale;
  const money = (n: number) => formatMoney(n, currency, locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialSupplierId =
    existingOrder?.supplier_id ??
    initialItems?.[0]?.supplierId ??
    suppliers[0]?.id ??
    "";
  const initialSupplierName =
    initialItems?.[0]?.supplierName ??
    suppliers.find((s) => s.id === initialSupplierId)?.name ??
    "";

  const freqLabel = (f: string) =>
    f === "daily" ? tr("daily") : f === "weekly" ? tr("weekly") : tr("monthly");
  const defaultName = (supplierName: string, f: string) =>
    supplierName ? `${supplierName} - ${freqLabel(f)} ${t("orderSuffix")}` : "";

  const [name, setName] = useState(
    existingOrder?.name ?? defaultName(initialSupplierName, "weekly"),
  );
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    (existingOrder?.frequency as "daily" | "weekly" | "monthly") ?? "weekly",
  );
  const [scheduleDays, setScheduleDays] = useState<number[]>(existingOrder?.schedule_days ?? []);
  const [deliveryOffset, setDeliveryOffset] = useState(existingOrder?.delivery_offset_days ?? 2);
  const [startDate, setStartDate] = useState(existingOrder?.start_date ?? new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(existingOrder?.end_date ?? "");
  const [hasEndDate, setHasEndDate] = useState(!!existingOrder?.end_date);
  const [notes, setNotes] = useState(existingOrder?.notes ?? "");
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [items, setItems] = useState<ItemData[]>(
    existingOrder?.items ??
      initialItems?.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        unit: i.unit,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
      })) ??
      [],
  );

  const isEdit = !!existingOrder;
  const supplierLocked = !!initialItems || isEdit;

  function handleFrequencyChange(f: "daily" | "weekly" | "monthly") {
    setFrequency(f);
    const currentSupplierName = suppliers.find((s) => s.id === supplierId)?.name ?? initialSupplierName;
    if (!name.trim()) setName(defaultName(currentSupplierName, f));
  }

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setItems([]);
    setShowProductPicker(false);
    setProductSearch("");
    const supplierName = suppliers.find((s) => s.id === id)?.name ?? "";
    if (!name.trim()) setName(defaultName(supplierName, frequency));
  }

  function updateItemQty(productId: string, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)));
    }
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function addProduct(product: AvailableProduct) {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      updateItemQty(product.id, existing.quantity + 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: product.price,
          quantity: product.min_order_qty ?? 1,
        },
      ]);
    }
  }

  const supplierProducts = products.filter(
    (p) => p.supplier_id === supplierId &&
      (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) return setError(t("errName"));
    if (!supplierId) return setError(t("errSupplier"));
    if (items.length === 0) return setError(t("errItems"));
    if (frequency !== "daily" && scheduleDays.length === 0) return setError(t("errDays"));

    setLoading(true);
    const data = {
      name: name.trim(),
      supplierId,
      frequency,
      scheduleDays,
      deliveryOffsetDays: deliveryOffset,
      startDate: startDate || undefined,
      endDate: hasEndDate && endDate ? endDate : undefined,
      notes: notes.trim() || undefined,
      items,
    };

    const result = isEdit
      ? await updateRecurringOrder(existingOrder!.id, data)
      : await createRecurringOrder(data);

    setLoading(false);
    if (result?.error) setError(result.error);
    else router.push("/restaurant/automations");
  }

  const estimatedTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>{t("nameLabel")}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="h-11" />
      </div>

      <div className="space-y-2">
        <Label>{t("supplier")}</Label>
        {supplierLocked ? (
          <div className="h-11 rounded-lg border bg-muted/30 px-3 flex items-center text-sm font-medium">
            {suppliers.find((s) => s.id === supplierId)?.name ?? initialSupplierName}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {suppliers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSupplierChange(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${supplierId === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>{t("items", { count: items.length })}</Label>

        {supplierId && supplierProducts.length > 0 && !showProductPicker && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowProductPicker(true)}>
            <Package className="h-3.5 w-3.5" />
            {t("browseProducts")}
          </Button>
        )}

        {showProductPicker && supplierId && supplierProducts.length > 0 && (
          <div className="rounded-xl border overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder={t("searchProducts")} value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="h-8 pl-8 text-xs" />
              </div>
              <button type="button" onClick={() => { setShowProductPicker(false); setProductSearch(""); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1">
                {t("close")}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {supplierProducts
                .filter((p) => !items.some((i) => i.productId === p.id))
                .slice(0, 15)
                .map((product) => (
                  <button key={product.id} type="button" onClick={() => addProduct(product)} className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{product.name}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-2">{money(product.price)} / {product.unit}</span>
                  </button>
                ))}
              {supplierProducts.filter((p) => !items.some((i) => i.productId === p.id)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">{t("allAdded")}</p>
              )}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
            {supplierProducts.length > 0 ? t("searchAddAbove") : t("noItems")}
          </p>
        ) : (
          <div className="rounded-xl border overflow-hidden divide-y">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">{money(item.unitPrice)} / {item.unit}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer" onClick={() => updateItemQty(item.productId, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
                  <button type="button" className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer" onClick={() => updateItemQty(item.productId, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="w-20 text-right font-semibold text-xs tabular-nums shrink-0">{money(item.unitPrice * item.quantity)}</span>
                <button type="button" className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5" onClick={() => removeItem(item.productId)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-muted/20 text-sm font-bold">
              <span>{t("estTotalPerOrder")}</span>
              <span className="tabular-nums">{money(estimatedTotal)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("scheduleLabel")}</Label>
        <ScheduleConfigurator
          frequency={frequency}
          scheduleDays={scheduleDays}
          onFrequencyChange={handleFrequencyChange}
          onScheduleDaysChange={setScheduleDays}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("deliveryOffset")}</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("deliver")}</span>
          <Input type="number" min={0} max={14} value={deliveryOffset} onChange={(e) => setDeliveryOffset(parseInt(e.target.value) || 0)} className="h-10 w-20 text-center" />
          <span className="text-sm text-muted-foreground">{t("daysAfter")}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("activePeriod")}</Label>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">{t("startDate")}</span>
            <Input type="date" className="h-10 w-44" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">{t("endDate")}</span>
            {hasEndDate ? (
              <div className="flex items-center gap-2">
                <Input type="date" className="h-10 w-44" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || new Date().toISOString().split("T")[0]} />
                <button type="button" onClick={() => { setHasEndDate(false); setEndDate(""); }} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline">
                  {t("remove")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 h-10">
                <span className="text-sm text-muted-foreground">{t("noEndDate")}</span>
                <button type="button" onClick={() => setHasEndDate(true)} className="text-xs text-primary hover:underline cursor-pointer font-medium">
                  {t("setEndDate")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("defaultNotes")}</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} rows={2} />
      </div>

      <Button className="w-full h-11 font-semibold" onClick={handleSubmit} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("saving")}
          </>
        ) : isEdit ? (
          t("update")
        ) : (
          t("create")
        )}
      </Button>
    </div>
  );
}
