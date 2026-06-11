"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  toggleProductAvailability,
  setProductsAvailability,
  deleteProduct,
} from "@/lib/actions/products";
import { ProductForm } from "./product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ListPagination } from "@/components/shared/order-list-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Eye, EyeOff, Plus, Search, X, Package } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";

const PAGE_SIZE = 25;

interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  price: number;
  min_order_qty: number | null;
  is_available: boolean | null;
  image_urls?: string[] | null;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type AvailabilityFilter = "all" | "available" | "unavailable";

export function ProductList({
  products,
  categories,
  currency = "RSD",
}: {
  products: Product[];
  categories: Category[];
  currency?: string;
}) {
  const t = useTranslations("productForm");
  const tu = useTranslations("productUnit");
  const tCommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      if (availability === "available" && p.is_available === false) return false;
      if (availability === "unavailable" && p.is_available !== false) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.categories?.name.toLowerCase().includes(q) ?? false)) {
        return false;
      }
      return true;
    });
  }, [products, search, availability]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggle(id: string, available: boolean) {
    startTransition(async () => {
      const r = await toggleProductAvailability(id, available);
      if (r?.error) toast.error(r.error);
    });
  }

  function bulkSetAvailability(available: boolean) {
    const ids = [...selected];
    startTransition(async () => {
      const r = await setProductsAvailability(ids, available);
      if (r?.error) toast.error(r.error);
      else {
        toast.success(available ? t("bulkAvailable") : t("bulkUnavailable"));
        setSelected(new Set());
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteProduct(id);
      if (r?.error) toast.error(r.error);
      else toast.success(tCommon("deleted"));
    });
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  }

  const filterChips: { key: AvailabilityFilter; label: string }[] = [
    { key: "all", label: tCommon("all") },
    { key: "available", label: t("filterAvailable") },
    { key: "unavailable", label: t("filterUnavailable") },
  ];

  return (
    <>
      {/* Toolbar: search + availability filter + add */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => {
                setAvailability(chip.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                availability === chip.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="pl-8 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button className="h-9 gap-1.5 shrink-0" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("addProduct")}
        </Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
          <span className="font-medium">{t("bulkSelected", { count: selected.size })}</span>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => bulkSetAvailability(true)}>
              <Eye className="h-3.5 w-3.5" />
              {t("bulkAvailable")}
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => bulkSetAvailability(false)}>
              <EyeOff className="h-3.5 w-3.5" />
              {t("bulkUnavailable")}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Button className="gap-1.5 mt-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("addProduct")}
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">{t("noMatches")}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allVisibleSelected} onCheckedChange={toggleSelectVisible} />
                </TableHead>
                <TableHead>{t("thName")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("thCategory")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("thUnit")}</TableHead>
                <TableHead className="text-right">{t("thPrice")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("thMinQty")}</TableHead>
                <TableHead>{t("thStatus")}</TableHead>
                <TableHead className="text-right">{t("thActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((product) => (
                <TableRow key={product.id} className={product.is_available === false ? "opacity-60" : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggleSelected(product.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {product.image_urls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_urls[0]}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover border shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="truncate" title={product.name}>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.categories?.name ?? "-"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{tu(product.unit)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(product.price, currency, locale)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{product.min_order_qty}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_available ? "default" : "secondary"}>
                      {product.is_available ? t("available_short") : t("unavailable")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggle(product.id, !product.is_available)}
                        title={product.is_available ? t("markUnavailable") : t("markAvailable")}
                      >
                        {product.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditProduct(product)}
                        title={t("editProduct")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" title={t("deleteConfirmTitle")}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                        title={t("deleteConfirmTitle")}
                        description={t("deleteConfirmBody")}
                        confirmLabel={t("deleteConfirmTitle")}
                        variant="destructive"
                        onConfirm={() => remove(product.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <ListPagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addNewProduct")}</DialogTitle>
          </DialogHeader>
          <ProductForm categories={categories} onSaved={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editProduct")}</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <ProductForm
              product={editProduct}
              categories={categories}
              onSaved={() => setEditProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
