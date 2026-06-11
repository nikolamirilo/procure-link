export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getAuthContext } from "@/lib/actions/_auth";
import { formatMoney } from "@/lib/format";
import { applyDiscount, bestDiscounts, todayStr } from "@/lib/pricing";
import type { Locale } from "@/i18n/config";
import { ArrowLeft, BadgeCheck, Phone, MapPin, Package, Truck, Clock, Wallet } from "lucide-react";

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

  const [{ data: products }, { data: slots }, tCart, tDays] = await Promise.all([
    ctx.supabase
      .from("products")
      .select("id, name, unit, price, description, image_urls")
      .eq("supplier_id", id)
      .eq("is_available", true)
      .order("name"),
    ctx.supabase
      .from("delivery_slots")
      .select("day_of_week")
      .eq("supplier_id", id)
      .eq("is_active", true),
    getTranslations("cart"),
    getTranslations("days"),
  ]);

  const deliveryDays = [...new Set((slots ?? []).map((s) => s.day_of_week))]
    .sort((a, b) => a - b)
    .map((d) => tDays(`short.${d + 1}`));
  const minOrder = Number(supplier.min_order_value ?? 0);
  const leadTime = Number(supplier.lead_time_hours ?? 0);

  // Active offer badges on this supplier's products
  const productIds = (products ?? []).map((p) => p.id);
  const { data: activeOffers } = productIds.length
    ? await ctx.supabase
        .from("offers")
        .select("product_id, discount_pct")
        .in("product_id", productIds)
        .eq("is_active", true)
        .lte("start_date", todayStr())
        .gte("end_date", todayStr())
    : { data: [] };
  const discounts = bestDiscounts(activeOffers ?? []);

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

        {/* Ordering constraints - what a restaurant needs before deciding */}
        {(deliveryDays.length > 0 || minOrder > 0 || leadTime > 0) && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 border-t text-sm">
            {deliveryDays.length > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {tCart("deliversOn")} {deliveryDays.join(", ")}
              </span>
            )}
            {minOrder > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                {tCart("minOrderLabel", {
                  amount: formatMoney(minOrder, supplier.currency ?? "RSD", locale),
                })}
              </span>
            )}
            {leadTime > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {tCart("leadTimeNote", { hours: leadTime })}
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> {t("products")}
        </h2>
        {products && products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const pct = discounts.get(p.id) ?? 0;
              const effective = applyDiscount(Number(p.price), pct);
              return (
                <div key={p.id} className="relative rounded-xl border bg-card overflow-hidden">
                  {pct > 0 && (
                    <span className="absolute top-2 right-2 z-10 rounded-full bg-red-600 text-white text-[11px] font-black px-2 py-0.5 shadow">
                      -{pct}%
                    </span>
                  )}
                  {p.image_urls?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_urls[0]}
                      alt={p.name}
                      loading="lazy"
                      className="h-28 w-full object-cover"
                    />
                  )}
                  <div className="p-4 space-y-1.5">
                    <p className="font-medium" title={p.name}>{p.name}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    )}
                    <p className="text-sm font-semibold tabular-nums">
                      {pct > 0 && (
                        <span className="line-through text-muted-foreground font-normal mr-1.5">
                          {formatMoney(Number(p.price), supplier.currency ?? "RSD", locale)}
                        </span>
                      )}
                      <span className={pct > 0 ? "text-red-600 dark:text-red-400" : ""}>
                        {formatMoney(effective, supplier.currency ?? "RSD", locale)}
                      </span>
                      <span className="text-muted-foreground font-normal"> / {p.unit}</span>
                    </p>
                  </div>
                </div>
              );
            })}
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
