"use client";

import {
  LayoutDashboard,
  Search,
  ShoppingCart,
  ClipboardList,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";
import { useCart } from "@/hooks/use-cart";

export function RestaurantSidebar() {
  const { items } = useCart();

  const restaurantNavItems = [
    { title: "Dashboard", href: "/restaurant/dashboard", icon: LayoutDashboard },
    { title: "Browse", href: "/restaurant/browse", icon: Search },
    { title: "Cart", href: "/restaurant/cart", icon: ShoppingCart, badge: items.length },
    { title: "Orders", href: "/restaurant/orders", icon: ClipboardList },
    { title: "Automations", href: "/restaurant/automations", icon: Repeat },
    { title: "Calendar", href: "/restaurant/calendar", icon: CalendarDays },
  ];

  return (
    <>
      <SidebarNav items={restaurantNavItems} title="ProcureLink" />
      <MobileHeader items={restaurantNavItems} title="ProcureLink" />
    </>
  );
}
