"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRecurringOrder,
  updateRecurringOrder,
} from "@/lib/actions/recurring-orders";
import { ScheduleConfigurator } from "./schedule-configurator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  existingOrder,
  initialItems,
}: RecurringOrderFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive initial supplier
  const initialSupplierId =
    existingOrder?.supplier_id ??
    initialItems?.[0]?.supplierId ??
    suppliers[0]?.id ??
    "";
  const initialSupplierName =
    initialItems?.[0]?.supplierName ??
    suppliers.find((s) => s.id === initialSupplierId)?.name ??
    "";

  const [name, setName] = useState(
    existingOrder?.name ??
      (initialSupplierName ? `${initialSupplierName} - Weekly Order` : ""),
  );
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(
    (existingOrder?.frequency as "daily" | "weekly" | "monthly") ?? "weekly",
  );
  const [scheduleDays, setScheduleDays] = useState<number[]>(
    existingOrder?.schedule_days ?? [],
  );
  const [deliveryOffset, setDeliveryOffset] = useState(
    existingOrder?.delivery_offset_days ?? 2,
  );
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

  const frequencyLabels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" } as const;

  function handleFrequencyChange(f: "daily" | "weekly" | "monthly") {
    setFrequency(f);
    // Auto-update name if it matches the pattern "SupplierName - Frequency Order"
    const currentSupplierName = suppliers.find((s) => s.id === supplierId)?.name ?? initialSupplierName;
    if (currentSupplierName) {
      const pattern = /^(.+)\s-\s(Daily|Weekly|Monthly)\sOrder$/;
      if (pattern.test(name) || !name.trim()) {
        setName(`${currentSupplierName} - ${frequencyLabels[f]} Order`);
      }
    }
  }

  function handleSupplierChange(id: string) {
    setSupplierId(id);
    setItems([]);
    setShowProductPicker(false);
    setProductSearch("");
    const supplierName = suppliers.find((s) => s.id === id)?.name ?? "";
    if (supplierName) {
      const pattern = /^(.+)\s-\s(Daily|Weekly|Monthly)\sOrder$/;
      if (pattern.test(name) || !name.trim()) {
        setName(`${supplierName} - ${frequencyLabels[frequency]} Order`);
      }
    }
  }

  function updateItemQty(productId: string, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity: qty } : i,
        ),
      );
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

  // Filter available products by selected supplier and search term
  const supplierProducts = products.filter(
    (p) => p.supplier_id === supplierId &&
      (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) return setError("Please enter a name");
    if (!supplierId) return setError("Please select a supplier");
    if (items.length === 0) return setError("Add at least one item");
    if (frequency !== "daily" && scheduleDays.length === 0) return setError("Select at least one day");

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

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/restaurant/automations");
    }
  }

  const estimatedTotal = items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label>Automation Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Weekly Meat Order"
          className="h-11"
        />
      </div>

      {/* Supplier */}
      <div className="space-y-2">
        <Label>Supplier</Label>
        {supplierLocked ? (
          <div className="h-11 rounded-lg border bg-muted/30 px-3 flex items-center text-sm font-medium">
            {suppliers.find((s) => s.id === supplierId)?.name ??
              initialSupplierName}
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {suppliers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSupplierChange(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  supplierId === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        <Label>Items ({items.length})</Label>

        {/* Product picker toggle */}
        {supplierId && supplierProducts.length > 0 && !showProductPicker && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowProductPicker(true)}
          >
            <Package className="h-3.5 w-3.5" />
            Browse Products
          </Button>
        )}

        {/* Product picker */}
        {showProductPicker && supplierId && supplierProducts.length > 0 && (
          <div className="rounded-xl border overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search products to add..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1"
              >
                Close
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y">
              {supplierProducts
                .filter((p) => !items.some((i) => i.productId === p.id))
                .slice(0, 15)
                .map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">{product.name}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      EUR {product.price.toFixed(2)} / {product.unit}
                    </span>
                  </button>
                ))}
              {supplierProducts.filter((p) => !items.some((i) => i.productId === p.id)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  All products already added
                </p>
              )}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/20">
            {supplierProducts.length > 0
              ? "Search and add products above"
              : "No items. Add items from your cart or select a supplier with products."}
          </p>
        ) : (
          <div className="rounded-xl border overflow-hidden divide-y">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium block truncate">
                    {item.productName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    EUR {item.unitPrice.toFixed(2)} / {item.unit}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer"
                    onClick={() =>
                      updateItemQty(item.productId, item.quantity - 1)
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="h-6 w-6 rounded-md border flex items-center justify-center hover:bg-muted cursor-pointer"
                    onClick={() =>
                      updateItemQty(item.productId, item.quantity + 1)
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="w-20 text-right font-semibold text-xs tabular-nums shrink-0">
                  EUR {(item.unitPrice * item.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2.5 bg-muted/20 text-sm font-bold">
              <span>Est. total per order</span>
              <span className="tabular-nums">EUR {estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label>Schedule - When to place orders</Label>
        <ScheduleConfigurator
          frequency={frequency}
          scheduleDays={scheduleDays}
          onFrequencyChange={handleFrequencyChange}
          onScheduleDaysChange={setScheduleDays}
        />
      </div>

      {/* Delivery offset */}
      <div className="space-y-2">
        <Label>Delivery Offset</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Deliver</span>
          <Input
            type="number"
            min={0}
            max={14}
            value={deliveryOffset}
            onChange={(e) => setDeliveryOffset(parseInt(e.target.value) || 0)}
            className="h-10 w-20 text-center"
          />
          <span className="text-sm text-muted-foreground">
            day{deliveryOffset !== 1 ? "s" : ""} after order is placed
          </span>
        </div>
      </div>

      {/* Start / End date */}
      <div className="space-y-2">
        <Label>Active Period</Label>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Start date</span>
            <Input
              type="date"
              className="h-10 w-44"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">End date</span>
            {hasEndDate ? (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="h-10 w-44"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                />
                <button
                  type="button"
                  onClick={() => { setHasEndDate(false); setEndDate(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 h-10">
                <span className="text-sm text-muted-foreground">No end date</span>
                <button
                  type="button"
                  onClick={() => setHasEndDate(true)}
                  className="text-xs text-primary hover:underline cursor-pointer font-medium"
                >
                  Set end date
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Default Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instructions added to every auto-placed order..."
          rows={2}
        />
      </div>

      {/* Submit */}
      <Button
        className="w-full h-11 font-semibold"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : isEdit ? (
          "Update Automation"
        ) : (
          "Create Automation"
        )}
      </Button>
    </div>
  );
}
