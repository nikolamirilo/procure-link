export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { OnboardingChecklist } from "@/components/shared/onboarding-checklist";
import { formatMoney, formatDay } from "@/lib/format";
import { FEATURES } from "@/lib/features";
import type { Locale } from "@/i18n/config";
import {
  Package,
  ClipboardList,
  Truck,
  Inbox,
  ArrowRight,
  TrendingUp,
  Tag,
} from "lucide-react";

export default async function SupplierDashboard() {
  const supabase = await createClient();
  const t = await getTranslations("dashboard");
  const tCheck = await getTranslations("checklist");
  const locale = (await getLocale()) as Locale;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_id")
    .eq("id", user!.id)
    .single();

  const companyId = profile?.company_id;
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();

  const [
    productsRes,
    ordersRes,
    pendingOrdersRes,
    pendingQueueRes,
    todaysDeliveriesRes,
    weekOrdersRes,
    slotsRes,
    companyRes,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", companyId!),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", companyId!),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", companyId!)
      .eq("status", "pending"),
    // Work queue: oldest pending first - first in, first served
    supabase
      .from("orders")
      .select(
        "id, order_number, placed_at, delivery_date, total, currency, restaurant:companies!orders_restaurant_id_fkey(name)"
      )
      .eq("supplier_id", companyId!)
      .eq("status", "pending")
      .order("placed_at", { ascending: true })
      .limit(5),
    // What goes out today
    supabase
      .from("orders")
      .select(
        "id, order_number, delivery_time, total, currency, status, restaurant:companies!orders_restaurant_id_fkey(name)"
      )
      .eq("supplier_id", companyId!)
      .eq("delivery_date", today)
      .in("status", ["confirmed", "preparing", "dispatched"])
      .order("delivery_time", { ascending: true, nullsFirst: false })
      .limit(8),
    // 7-day volume
    supabase
      .from("orders")
      .select("total")
      .eq("supplier_id", companyId!)
      .neq("status", "cancelled")
      .gte("placed_at", sevenDaysAgo),
    supabase
      .from("delivery_slots")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", companyId!),
    supabase
      .from("companies")
      .select("phone, email, currency")
      .eq("id", companyId!)
      .single(),
  ]);

  const productsCount = productsRes.count ?? 0;
  const slotsCount = slotsRes.count ?? 0;
  const company = companyRes.data;
  const contactDone = !!(company?.phone || company?.email);
  const currency = company?.currency ?? "RSD";
  const pendingQueue = pendingQueueRes.data ?? [];
  const todaysDeliveries = todaysDeliveriesRes.data ?? [];
  const weekOrders = weekOrdersRes.data ?? [];
  const weekRevenue = weekOrders.reduce((s, o) => s + Number(o.total), 0);

  const stats = [
    { title: t("products"), value: productsCount, icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { title: t("totalOrders"), value: ordersRes.count ?? 0, icon: ClipboardList, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-400/10" },
    { title: t("ordersLast7"), value: weekOrders.length, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-400/10" },
    { title: t("pending"), value: pendingOrdersRes.count ?? 0, icon: Truck, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-400/10" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("welcome", { name: profile?.full_name ?? t("fallbackSupplier") })}
        description={t("overviewSupplier")}
      />

      <OnboardingChecklist
        title={tCheck("title")}
        subtitle={tCheck("subtitle")}
        items={[
          { label: tCheck("supProduct"), done: productsCount > 0, href: "/supplier/products" },
          { label: tCheck("supSlot"), done: slotsCount > 0, href: "/supplier/delivery" },
          { label: tCheck("supContact"), done: contactDone, href: "/supplier/settings" },
        ]}
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

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Needs action - the supplier's actual job */}
        <div className="rounded-2xl border bg-card p-6 premium-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              {t("needsAction")}
            </h2>
            <Link
              href="/supplier/orders"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {t("viewAllOrders")}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {pendingQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t("noPending")}</p>
          ) : (
            <div className="divide-y">
              {pendingQueue.map((o) => (
                <Link
                  key={o.id}
                  href={`/supplier/orders/${o.id}`}
                  className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {(o.restaurant as unknown as { name?: string } | null)?.name ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {o.order_number}
                      {" · "}
                      {formatDay(o.delivery_date, "d. MMM", locale)}
                    </span>
                  </div>
                  <span className="font-bold tabular-nums text-xs shrink-0">
                    {formatMoney(o.total, o.currency, locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's deliveries */}
        <div className="rounded-2xl border bg-card p-6 premium-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {t("todaysDeliveries")}
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("revenueLast7")}: {formatMoney(weekRevenue, currency, locale)}
            </span>
          </div>
          {todaysDeliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              {t("noDeliveriesToday")}
            </p>
          ) : (
            <div className="divide-y">
              {todaysDeliveries.map((o) => (
                <Link
                  key={o.id}
                  href={`/supplier/orders/${o.id}`}
                  className="flex items-center gap-3 py-2.5 text-sm hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {(o.restaurant as unknown as { name?: string } | null)?.name ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{o.order_number}</span>
                  </div>
                  {o.delivery_time && (
                    <span className="text-xs text-primary font-semibold shrink-0">
                      {o.delivery_time.slice(0, 5)}
                    </span>
                  )}
                  <span className="font-bold tabular-nums text-xs shrink-0">
                    {formatMoney(o.total, o.currency, locale)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-card p-6 premium-shadow">
        <h2 className="font-semibold text-lg mb-4">{t("quickActions")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("addProduct"), href: "/supplier/products", icon: Package },
            { label: t("viewOrders"), href: "/supplier/orders", icon: ClipboardList },
            { label: t("deliverySlots"), href: "/supplier/delivery", icon: Truck },
            ...(FEATURES.offers
              ? [{ label: t("myOffers"), href: "/supplier/offers", icon: Tag }]
              : []),
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors group"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
