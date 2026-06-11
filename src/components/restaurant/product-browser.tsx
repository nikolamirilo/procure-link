"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShoppingCart,
  Package,
  X,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/format";
import { applyDiscount } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  min_order_qty: number | null;
  supplier_id: string;
  image_urls?: string[] | null;
  categories: { name: string } | null;
  companies: { name: string; slug: string; currency: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Supplier {
  id: string;
  name: string;
  slug: string;
}

type SortKey = "name" | "priceAsc" | "priceDesc";

export function ProductBrowser({
  products,
  categories,
  suppliers,
  discounts = {},
}: {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  /** productId -> active offer discount %, computed server-side. */
  discounts?: Record<string, number>;
}) {
  const t = useTranslations("browse");
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState("");
  // Deferred search keeps typing snappy on large catalogs without a debounce timer.
  const deferredSearch = useDeferredValue(search);
  // Multi-select: "vegetables AND fruit from supplier A OR B" is a real query.
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [offersOnly, setOffersOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const {
    addItem,
    getItemQuantity,
    items,
    updateQuantity,
    removeItem,
    getSupplierIds,
    getSupplierItems,
    totalItems,
  } = useCart();

  const hasFilters =
    !!search || categoryFilter.length > 0 || supplierFilter.length > 0 || offersOnly;

  const effectivePrice = (p: Product) => applyDiscount(p.price, discounts[p.id]);

  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.toLowerCase();
    const selectedCategoryNames = new Set(
      categoryFilter.map((id) => categoryNameById.get(id)).filter(Boolean)
    );
    const selectedSuppliers = new Set(supplierFilter);

    const list = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategoryNames.size === 0 ||
        (p.categories && selectedCategoryNames.has(p.categories.name));
      const matchesSupplier =
        selectedSuppliers.size === 0 || selectedSuppliers.has(p.supplier_id);
      const matchesOffer = !offersOnly || (discounts[p.id] ?? 0) > 0;
      return matchesSearch && matchesCategory && matchesSupplier && matchesOffer;
    });

    // Price sort uses the effective (discounted) price - what you'd pay.
    return [...list].sort((a, b) => {
      if (sort === "priceAsc") return effectivePrice(a) - effectivePrice(b);
      if (sort === "priceDesc") return effectivePrice(b) - effectivePrice(a);
      return a.name.localeCompare(b.name, locale);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, deferredSearch, categoryFilter, supplierFilter, offersOnly, sort, categoryNameById, locale, discounts]);

  function toggleInList(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter([]);
    setSupplierFilter([]);
    setOffersOnly(false);
  }

  // Cart totals per currency for the mobile bar (suppliers may differ).
  const cartTotals = useMemo(() => {
    const byCurrency = new Map<string, number>();
    for (const i of items) {
      byCurrency.set(i.currency, (byCurrency.get(i.currency) ?? 0) + i.unitPrice * i.quantity);
    }
    return [...byCurrency.entries()]
      .map(([cur, total]) => formatMoney(total, cur, locale))
      .join(" + ");
  }, [items, locale]);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="sm:w-56">
          <Select value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
            <SelectTrigger className="h-11">
              <span className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">{t("sortName")}</SelectItem>
              <SelectItem value="priceAsc">{t("sortPriceAsc")}</SelectItem>
              <SelectItem value="priceDesc">{t("sortPriceDesc")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category chips - multi-select */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t("category")}:</span>
        <button
          onClick={() => setCategoryFilter([])}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            categoryFilter.length === 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("all")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter((prev) => toggleInList(prev, c.id))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              categoryFilter.includes(c.id)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Supplier chips - multi-select */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t("supplier")}:</span>
        <button
          onClick={() => setSupplierFilter([])}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            supplierFilter.length === 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("all")}
        </button>
        {suppliers.map((s) => (
          <button
            key={s.id}
            onClick={() => setSupplierFilter((prev) => toggleInList(prev, s.id))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              supplierFilter.includes(s.id)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Active filter summary + offers toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOffersOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
              offersOnly
                ? "bg-red-600 text-white"
                : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
            }`}
          >
            % {t("onOffer")}
          </button>
          <p className="text-sm text-muted-foreground">
            {t("results", { count: filtered.length })}
          </p>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" />
            {t("clearAll")}
          </Button>
        )}
      </div>

      <div className={`grid gap-6 ${items.length > 0 ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        {/* Product grid */}
        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">{t("noResults")}</p>
              <p className="text-sm text-muted-foreground">{t("noResultsHint")}</p>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  {t("clearAll")}
                </Button>
              )}
            </div>
          ) : (
            <div className={`grid gap-4 sm:grid-cols-2 ${items.length > 0 ? "xl:grid-cols-3" : "lg:grid-cols-3 2xl:grid-cols-4"}`}>
              {filtered.map((product) => {
                const qty = getItemQuantity(product.id);
                const currency = product.companies?.currency ?? "RSD";
                const minQty = product.min_order_qty ?? 1;
                const image = product.image_urls?.[0];
                const pct = discounts[product.id] ?? 0;
                const price = effectivePrice(product);
                return (
                  <div
                    key={product.id}
                    className="group relative rounded-2xl border bg-card premium-shadow hover:premium-shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col"
                  >
                    {pct > 0 && (
                      <span className="absolute top-2 right-2 z-10 rounded-full bg-red-600 text-white text-[11px] font-black px-2 py-0.5 shadow">
                        -{pct}%
                      </span>
                    )}
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary/20" />
                    )}
                    <div className="p-5 space-y-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[15px] truncate" title={product.name}>
                            {product.name}
                          </h3>
                          {/* Supplier name links to the profile - it was dead text */}
                          <Link
                            href={`/restaurant/suppliers/${product.supplier_id}`}
                            className="text-xs text-muted-foreground mt-0.5 hover:text-primary hover:underline block truncate"
                            title={product.companies?.name}
                          >
                            {product.companies?.name}
                          </Link>
                        </div>
                        {product.categories && (
                          <Badge variant="outline" className="text-[10px] shrink-0 px-2 py-0.5 font-medium">
                            {product.categories.name}
                          </Badge>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-end justify-between pt-1 mt-auto">
                        <div>
                          {pct > 0 && (
                            <span className="block text-xs text-muted-foreground line-through tabular-nums">
                              {formatMoney(product.price, currency, locale)}
                            </span>
                          )}
                          <span className={`text-xl font-bold tracking-tight ${pct > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                            {formatMoney(price, currency, locale)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t("min")}: {minQty} {product.unit}
                          </p>
                        </div>
                        {qty > 0 ? (
                          /* Inline stepper - adjust without hunting for the sidebar */
                          <div className="flex items-center gap-1">
                            <button
                              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                              onClick={() =>
                                updateQuantity(product.id, qty - 1 < minQty ? 0 : qty - 1)
                              }
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
                            <button
                              className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => updateQuantity(product.id, qty + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-lg h-8 px-3 font-semibold text-xs"
                            onClick={() =>
                              addItem({
                                productId: product.id,
                                productName: product.name,
                                unit: product.unit,
                                unitPrice: price,
                                ...(pct > 0
                                  ? { originalUnitPrice: product.price, discountPct: pct }
                                  : {}),
                                supplierId: product.supplier_id,
                                supplierName: product.companies?.name ?? "",
                                minQty,
                                currency,
                              })
                            }
                          >
                            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                            {t("add")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar (desktop) */}
        {items.length > 0 && (
          <div className="hidden lg:block">
            <div className="sticky top-6 rounded-2xl border bg-card premium-shadow overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{t("cart")}</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {t("items", { count: totalItems })}
                </Badge>
              </div>

              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {getSupplierIds().map((supplierId) => {
                  const supplierItems = getSupplierItems(supplierId);
                  const supplierName = supplierItems[0]?.supplierName ?? "";
                  const currency = supplierItems[0]?.currency ?? "RSD";
                  const subtotal = supplierItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

                  return (
                    <div key={supplierId} className="border-b last:border-b-0">
                      <div className="px-3 py-2 bg-muted/20 flex items-center justify-between">
                        <span className="text-xs font-semibold truncate" title={supplierName}>{supplierName}</span>
                        <span className="text-xs font-bold tabular-nums shrink-0 ml-2">
                          {formatMoney(subtotal, currency, locale)}
                        </span>
                      </div>
                      <div className="divide-y">
                        {supplierItems.map((item) => (
                          <div key={item.productId} className="px-3 py-2 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-medium leading-tight truncate block" title={item.productName}>
                                  {item.productName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatMoney(item.unitPrice, item.currency, locale)} / {item.unit}
                                </span>
                              </div>
                              <button
                                className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer p-0.5 transition-colors"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </button>
                                <span className="w-6 text-center text-[11px] font-semibold tabular-nums">{item.quantity}</span>
                                <button
                                  className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                                <span className="text-[10px] text-muted-foreground ml-1">{item.unit}</span>
                              </div>
                              <span className="text-xs font-semibold tabular-nums">
                                {formatMoney(item.unitPrice * item.quantity, item.currency, locale)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t space-y-3">
                <Separator />
                <Link href="/restaurant/cart">
                  <Button className="w-full h-9 font-semibold text-xs">
                    {t("goToCart")}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky cart bar - the sidebar is desktop-only, but most
          restaurant ordering happens on a phone in the kitchen */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur px-4 py-3">
          <Link href="/restaurant/cart" className="block">
            <Button className="w-full h-11 font-semibold justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t("items", { count: totalItems })}
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {cartTotals}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
