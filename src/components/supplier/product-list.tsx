"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  toggleProductAvailability,
  deleteProduct,
} from "@/lib/actions/products";
import { ProductForm } from "./product-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit: string;
  price: number;
  min_order_qty: number | null;
  is_available: boolean | null;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

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
  const locale = useLocale() as Locale;
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [, startTransition] = useTransition();

  function toggle(id: string, available: boolean) {
    startTransition(async () => {
      const r = await toggleProductAvailability(id, available);
      if (r?.error) toast.error(r.error);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const r = await deleteProduct(id);
      if (r?.error) toast.error(r.error);
      else toast.success(t("deleteConfirmTitle"));
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 gap-1.5 px-2.5 cursor-pointer hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            {t("addProduct")}
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("addNewProduct")}</DialogTitle>
            </DialogHeader>
            <ProductForm categories={categories} />
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("emptyBody")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("thName")}</TableHead>
              <TableHead>{t("thCategory")}</TableHead>
              <TableHead>{t("thUnit")}</TableHead>
              <TableHead className="text-right">{t("thPrice")}</TableHead>
              <TableHead>{t("thMinQty")}</TableHead>
              <TableHead>{t("thStatus")}</TableHead>
              <TableHead className="text-right">{t("thActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.categories?.name ?? "-"}</TableCell>
                <TableCell>{tu(product.unit)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(product.price, currency, locale)}
                </TableCell>
                <TableCell>{product.min_order_qty}</TableCell>
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
                    <Button variant="ghost" size="icon" onClick={() => setEditProduct(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon">
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
      )}

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editProduct")}</DialogTitle>
          </DialogHeader>
          {editProduct && <ProductForm product={editProduct} categories={categories} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
