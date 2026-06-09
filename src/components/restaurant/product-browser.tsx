"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShoppingCart, Package, X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";

interface Product {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  min_order_qty: number | null;
  supplier_id: string;
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

export function ProductBrowser({
  products,
  categories,
  suppliers,
}: {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
}) {
  const t = useTranslations("browse");
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const { addItem, getItemQuantity, items, updateQuantity, removeItem, getSupplierIds, getSupplierItems, totalItems } = useCart();

  const hasFilters = !!search || !!categoryFilter || !!supplierFilter;

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !categoryFilter ||
        p.categories?.name ===
          categories.find((c) => c.id === categoryFilter)?.name;
      const matchesSupplier =
        !supplierFilter || p.supplier_id === supplierFilter;
      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [products, search, categoryFilter, supplierFilter, categories]);

  function clearFilters() {
    setSearch("");
    setCategoryFilter(null);
    setSupplierFilter(null);
  }

  const activeCategoryName = categoryFilter
    ? categories.find((c) => c.id === categoryFilter)?.name
    : null;
  const activeSupplierName = supplierFilter
    ? suppliers.find((s) => s.id === supplierFilter)?.name
    : null;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
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

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t("category")}:</span>
        <button
          onClick={() => setCategoryFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            !categoryFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("all")}
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              categoryFilter === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Supplier chips */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs font-medium text-muted-foreground mr-1">{t("supplier")}:</span>
        <button
          onClick={() => setSupplierFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
            !supplierFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("all")}
        </button>
        {suppliers.map((s) => (
          <button
            key={s.id}
            onClick={() => setSupplierFilter(supplierFilter === s.id ? null : s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              supplierFilter === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Active filter summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("results", { count: filtered.length })}
          {activeCategoryName && (
            <span> {t("inCategory")} <span className="font-medium text-foreground">{activeCategoryName}</span></span>
          )}
          {activeSupplierName && (
            <span> {t("fromSupplier")} <span className="font-medium text-foreground">{activeSupplierName}</span></span>
          )}
        </p>
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
                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border bg-card premium-shadow hover:premium-shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary/20" />
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-[15px] truncate">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{product.companies?.name}</p>
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

                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <span className="text-xl font-bold tracking-tight">
                            {formatMoney(product.price, currency, locale)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/{product.unit}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {t("min")}: {product.min_order_qty ?? 1} {product.unit}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={qty > 0 ? "secondary" : "default"}
                          className="rounded-lg h-8 px-3 font-semibold text-xs"
                          onClick={() =>
                            addItem({
                              productId: product.id,
                              productName: product.name,
                              unit: product.unit,
                              unitPrice: product.price,
                              supplierId: product.supplier_id,
                              supplierName: product.companies?.name ?? "",
                              minQty: product.min_order_qty ?? 1,
                              currency,
                            })
                          }
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          {qty > 0 ? `(${qty})` : t("add")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart sidebar */}
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
                        <span className="text-xs font-semibold truncate">{supplierName}</span>
                        <span className="text-xs font-bold tabular-nums shrink-0 ml-2">
                          {formatMoney(subtotal, currency, locale)}
                        </span>
                      </div>
                      <div className="divide-y">
                        {supplierItems.map((item) => (
                          <div key={item.productId} className="px-3 py-2 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-xs font-medium leading-tight truncate block">{item.productName}</span>
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
    </div>
  );
}
