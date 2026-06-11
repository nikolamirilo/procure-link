"use client";

import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  Truck,
  Settings,
  CreditCard,
} from "lucide-react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";
import { usePendingOrdersCount } from "@/hooks/use-pending-orders";
import { FEATURES } from "@/lib/features";
import { useTranslations } from "next-intl";

export function SupplierSidebar() {
  const t = useTranslations("nav");
  // Pending orders are the supplier's work queue - the count lives on the nav
  // item so a new order is visible from any page, on any device.
  const pendingCount = usePendingOrdersCount();

  const supplierNavItems = [
    { title: t("dashboard"), href: "/supplier/dashboard", icon: LayoutDashboard },
    { title: t("products"), href: "/supplier/products", icon: Package },
    ...(FEATURES.offers
      ? [{ title: t("offers"), href: "/supplier/offers", icon: Tag }]
      : []),
    { title: t("orders"), href: "/supplier/orders", icon: ClipboardList, badge: pendingCount },
    { title: t("delivery"), href: "/supplier/delivery", icon: Truck },
    { title: t("billing"), href: "/supplier/billing", icon: CreditCard },
    { title: t("settings"), href: "/supplier/settings", icon: Settings },
  ];

  return (
    <>
      <SidebarNav items={supplierNavItems} title="ProcureLink" />
      <MobileHeader items={supplierNavItems} title="ProcureLink" />
    </>
  );
}
