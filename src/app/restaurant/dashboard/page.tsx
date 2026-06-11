export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, getLocale } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { OnboardingChecklist } from "@/components/shared/onboarding-checklist";
import { ReorderButton } from "@/components/restaurant/reorder-button";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import {
  ShoppingCart,
  ClipboardList,
  Truck,
  Clock,
  Search,
  CalendarDays,
  TriangleAlert,
  PackageCheck,
} from "lucide-react";

export default async function RestaurantDashboard() {
  const supabase = await createClient();
  const t = await getTranslations("dashboard");
  const tn = await getTranslations("nav");
  const tCheck = await getTranslations("checklist");
  const tStatus = await getTranslations("orderStatus");
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
    totalOrdersRes,
    activeOrdersRes,
    deliveredRes,
    pendingRes,
    nextDeliveryRes,
    recentOrdersRes,
    automationsRes,
    failedRunsRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", companyId!),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", companyId!)
      .in("status", ["confirmed", "preparing", "dispatched"]),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", companyId!)
      .eq("status", "delivered"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", companyId!)
      .eq("status", "pending"),
    // Next upcoming delivery (not cancelled/delivered)
    supabase
      .from("orders")
      .select(
        "id, order_number, delivery_date, delivery_time, status, total, currency, supplier:companies!orders_supplier_id_fkey(name), order_items(id)"
      )
      .eq("restaurant_id", companyId!)
      .gte("delivery_date", today)
      .in("status", ["pending", "confirmed", "preparing", "dispatched"])
      .order("delivery_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // Recent orders for one-click reorder
    supabase
      .from("orders")
      .select(
        "id, order_number, total, currency, placed_at, supplier:companies!orders_supplier_id_fkey(name)"
      )
      .eq("restaurant_id", companyId!)
      .neq("status", "cancelled")
      .order("placed_at", { ascending: false })
      .limit(3),
    supabase
      .from("recurring_orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", companyId!),
    // Automation failures in the last 7 days - silent failures break trust
    supabase
      .from("recurring_order_runs")
      .select("id, recurring_order_id, recurring_orders!inner(restaurant_id)", {
        count: "exact",
        head: true,
      })
      .eq("status", "error")
      .eq("recurring_orders.restaurant_id", companyId!)
      .gte("run_at", sevenDaysAgo),
  ]);

  const totalOrders = totalOrdersRes.count ?? 0;
  const nextDelivery = nextDeliveryRes.data;
  const recentOrders = recentOrdersRes.data ?? [];
  const failedRuns = failedRunsRes.count ?? 0;

  const stats = [
    { title: t("totalOrders"), value: totalOrders, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { title: t("activeOrders"), value: activeOrdersRes.count ?? 0, icon: ShoppingCart, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-400/10" },
    { title: t("delivered"), value: deliveredRes.count ?? 0, icon: Truck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-400/10" },
    { title: t("pending"), value: pendingRes.count ?? 0, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-400/10" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("welcome", { name: profile?.full_name ?? t("fallbackRestaurant") })}
        description={t("overviewRestaurant")}
      />

      {/* Failed automations need eyes NOW - top of page */}
      {failedRuns > 0 && (
        <Link
          href="/restaurant/automations"
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm hover:bg-destructive/10 transition-colors"
        >
          <TriangleAlert className="h-4 w-4 text-destructive shrink-0" />
          <span className="flex-1 font-medium text-destructive">
            {t("failedRuns", { count: failedRuns })}
          </span>
          <span className="text-destructive font-semibold">{t("review")}</span>
        </Link>
      )}

      <OnboardingChecklist
        title={tCheck("title")}
        subtitle={tCheck("subtitle")}
        items={[
          { label: tCheck("restOrder"), done: totalOrders > 0, href: "/restaurant/browse" },
          {
            label: tCheck("restAutomation"),
            done: (automationsRes.count ?? 0) > 0,
            href: "/restaurant/automations/new",
          },
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
        {/* Next delivery */}
        <div className="rounded-2xl border bg-card p-6 premium-shadow">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            {t("nextDelivery")}
          </h2>
          {nextDelivery ? (
            <Link
              href={`/restaurant/orders/${nextDelivery.id}`}
              className="block rounded-xl border p-4 hover:bg-muted/40 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {(nextDelivery.supplier as unknown as { name?: string } | null)?.name ?? "-"}
                </span>
                <Badge
                  className={
                    (ORDER_STATUSES[
                      (nextDelivery.status ?? "pending") as keyof typeof ORDER_STATUSES
                    ]?.color ?? "") + " text-xs"
                  }
                >
                  {tStatus(
                    (nextDelivery.status ?? "pending") as
                      | "pending"
                      | "confirmed"
                      | "preparing"
                      | "dispatched"
                      | "delivered"
                      | "cancelled"
                  )}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-between">
                <span>
                  {formatDay(nextDelivery.delivery_date, "EEEE, d. MMM yyyy.", locale)}
                  {nextDelivery.delivery_time && ` · ${nextDelivery.delivery_time.slice(0, 5)}`}
                </span>
                <span className="font-mono text-xs">{nextDelivery.order_number}</span>
              </div>
              <div className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("itemsShort", { count: nextDelivery.order_items?.length ?? 0 })}
                </span>
                <span className="font-bold tabular-nums">
                  {formatMoney(nextDelivery.total, nextDelivery.currency, locale)}
                </span>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">{t("noUpcoming")}</p>
          )}
        </div>

        {/* Order again */}
        <div className="rounded-2xl border bg-card p-6 premium-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{t("orderAgain")}</h2>
            <Link
              href="/restaurant/orders"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("viewAllOrders")}
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t("noRecentOrders")}</p>
          ) : (
            <div className="divide-y">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {(o.supplier as unknown as { name?: string } | null)?.name ?? "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.placed_at ? formatDay(o.placed_at, "d. MMM yyyy.", locale) : ""}
                      {" · "}
                      <span className="tabular-nums">{formatMoney(o.total, o.currency, locale)}</span>
                    </span>
                  </div>
                  <ReorderButton orderId={o.id} />
                </div>
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
            { label: tn("browse"), href: "/restaurant/browse", icon: Search },
            { label: tn("cart"), href: "/restaurant/cart", icon: ShoppingCart },
            { label: tn("orders"), href: "/restaurant/orders", icon: ClipboardList },
            { label: tn("calendar"), href: "/restaurant/calendar", icon: CalendarDays },
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
