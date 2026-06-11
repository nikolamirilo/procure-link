"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/client";
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
import { Loader2, ImagePlus, X } from "lucide-react";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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
    image_urls?: string[] | null;
  };
  onSaved?: () => void;
}

export function ProductForm({ categories, product, onSaved }: ProductFormProps) {
  const t = useTranslations("productForm");
  const tu = useTranslations("productUnit");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState(product?.unit ?? "kg");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.is_available !== false);
  // Image: existing URL, a freshly picked file (preview), or removed.
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_urls?.[0] ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickImage(file: File | null) {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError(t("imageHelp"));
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /** Uploads to the supplier's own folder in the product-images bucket. */
  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const companyId = (session?.user?.app_metadata as { company_id?: string } | undefined)
      ?.company_id;
    if (!companyId) return null;
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${companyId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type });
    if (upErr) return null;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  function validate(formData: FormData): boolean {
    const errs: Record<string, string> = {};
    if (!String(formData.get("name") ?? "").trim()) errs.name = t("errName");
    const price = Number(formData.get("price"));
    if (!Number.isFinite(price) || price <= 0) errs.price = t("errPrice");
    if (!categoryId) errs.category = t("errCategory");
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (!validate(formData)) return;
    setLoading(true);

    let finalImageUrl = imageUrl ?? "";
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (!uploaded) {
        setError(t("uploadError"));
        setLoading(false);
        return;
      }
      finalImageUrl = uploaded;
    }

    formData.set("unit", unit);
    formData.set("categoryId", categoryId);
    formData.set("isAvailable", String(isAvailable));
    formData.set("imageUrl", finalImageUrl);

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onSaved?.();
    }
  }

  const shownImage = imagePreview ?? imageUrl;

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Photo - products with images get ordered; text-only cards don't */}
      <div className="space-y-2">
        <Label>{t("image")}</Label>
        <div className="flex items-center gap-3">
          {shownImage ? (
            <div className="relative h-20 w-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shownImage}
                alt=""
                className="h-20 w-20 rounded-lg object-cover border"
              />
              <button
                type="button"
                onClick={removeImage}
                title={t("removeImage")}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center cursor-pointer hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 shrink-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          )}
          <div className="text-xs text-muted-foreground">{t("imageHelp")}</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={product?.name}
          placeholder={t("namePlaceholder")}
          aria-invalid={!!fieldErrors.name}
          required
        />
        {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
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
            <SelectTrigger aria-invalid={!!fieldErrors.category}>
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
          {fieldErrors.category && (
            <p className="text-xs text-destructive">{fieldErrors.category}</p>
          )}
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
            aria-invalid={!!fieldErrors.price}
            required
          />
          {fieldErrors.price && <p className="text-xs text-destructive">{fieldErrors.price}</p>}
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
