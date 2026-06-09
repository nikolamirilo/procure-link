"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PRODUCT_UNITS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    unit: string;
    price: number;
    min_order_qty: number | null;
    is_available: boolean | null;
  };
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const t = useTranslations("productForm");
  const tu = useTranslations("productUnit");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState(product?.unit ?? "kg");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.is_available !== false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("unit", unit);
    formData.set("categoryId", categoryId);
    formData.set("isAvailable", String(isAvailable));

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder={t("namePlaceholder")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder={t("descPlaceholder")}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("category")}</Label>
          <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("unit")}</Label>
          <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {tu(u.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">{t("price")}</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minOrderQty">{t("minOrderQty")}</Label>
          <Input
            id="minOrderQty"
            name="minOrderQty"
            type="number"
            min="1"
            defaultValue={product?.min_order_qty ?? 1}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="isAvailable"
          checked={isAvailable}
          onCheckedChange={(v) => setIsAvailable(v === true)}
        />
        <Label htmlFor="isAvailable">{t("available")}</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? t("saving") : product ? t("update") : t("create")}
      </Button>
    </form>
  );
}
