export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getAuthContext } from "@/lib/actions/_auth";
import { formatMoney } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { ArrowLeft, BadgeCheck, Phone, MapPin, Package } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierProfilePage({ params }: Props) {
  const { id } = await params;
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const t = await getTranslations("supplierProfile");
  const locale = (await getLocale()) as Locale;

  const { data: supplier } = await ctx.supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("type", "supplier")
    .maybeSingle();
  if (!supplier) notFound();

  const { data: products } = await ctx.supabase
    .from("products")
    .select("id, name, unit, price, description")
    .eq("supplier_id", id)
    .eq("is_available", true)
    .order("name");

  return (
    <div className="space-y-6">
      <Link
        href="/restaurant/browse"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToBrowse")}
      </Link>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          {supplier.is_verified && (
            <span
              title={t("verifiedTooltip")}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              {t("verified")}
            </span>
          )}
        </div>
        {supplier.description && (
          <p className="text-sm text-muted-foreground">{supplier.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {supplier.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> {supplier.phone}
            </span>
          )}
          {(supplier.address || supplier.city) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {[supplier.address, supplier.city].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> {t("products")}
        </h2>
        {products && products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 space-y-1.5">
                <p className="font-medium">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}
                <p className="text-sm font-semibold tabular-nums">
                  {formatMoney(Number(p.price), supplier.currency ?? "RSD", locale)}
                  <span className="text-muted-foreground font-normal"> / {p.unit}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("noProducts")}
          </p>
        )}
      </div>
    </div>
  );
}
