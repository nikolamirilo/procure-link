"use client";

import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  ClipboardList,
  CalendarDays,
  Repeat,
  Settings,
} from "lucide-react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";
import { useCart } from "@/hooks/use-cart";
import { useTranslations } from "next-intl";

export function RestaurantSidebar() {
  const { items } = useCart();
  const t = useTranslations("nav");

  const restaurantNavItems = [
    { title: t("dashboard"), href: "/restaurant/dashboard", icon: LayoutDashboard },
    { title: t("browse"), href: "/restaurant/browse", icon: Search },
    { title: t("cart"), href: "/restaurant/cart", icon: ShoppingCart, badge: items.length },
    { title: t("orders"), href: "/restaurant/orders", icon: ClipboardList },
    { title: t("automations"), href: "/restaurant/automations", icon: Repeat },
    { title: t("calendar"), href: "/restaurant/calendar", icon: CalendarDays },
    { title: t("settings"), href: "/restaurant/settings", icon: Settings },
  ];

  return (
    <>
      <SidebarNav items={restaurantNavItems} title="ProcureLink" />
      <MobileHeader items={restaurantNavItems} title="ProcureLink" />
    </>
  );
}
