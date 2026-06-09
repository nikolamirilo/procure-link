export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { Package, ClipboardList, Tag, Truck } from "lucide-react";

export default async function SupplierDashboard() {
  const supabase = await createClient();
  const t = await getTranslations("dashboard");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id")
    .eq("id", user!.id)
    .single();

  const companyId = profile?.company_id;

  const [productsRes, ordersRes, activeOffersRes, pendingOrdersRes] =
    await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", companyId!),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", companyId!),
      supabase
        .from("offers")
        .select("id, product_id, products!inner(supplier_id)", {
          count: "exact",
          head: true,
        })
        .eq("is_active", true)
        .eq("products.supplier_id", companyId!),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", companyId!)
        .eq("status", "pending"),
    ]);

  const stats = [
    { title: t("products"), value: productsRes.count ?? 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { title: t("totalOrders"), value: ordersRes.count ?? 0, icon: ClipboardList, color: "text-teal-600", bg: "bg-teal-50" },
    { title: t("myOffers"), value: activeOffersRes.count ?? 0, icon: Tag, color: "text-amber-600", bg: "bg-amber-50" },
    { title: t("pending"), value: pendingOrdersRes.count ?? 0, icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("welcome", { name: profile?.full_name ?? t("fallbackSupplier") })}
        description={t("overviewSupplier")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border bg-card p-5 premium-shadow hover:premium-shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div
                  className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-card p-6 premium-shadow">
        <h2 className="font-semibold text-lg mb-4">{t("quickActions")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("addProduct"), href: "/supplier/products", icon: Package },
            { label: t("myOffers"), href: "/supplier/offers", icon: Tag },
            { label: t("viewOrders"), href: "/supplier/orders", icon: ClipboardList },
            { label: t("deliverySlots"), href: "/supplier/delivery", icon: Truck },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
