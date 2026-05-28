"use client";

import {
  LayoutDashboard,
  Package,
  Tag,
  ClipboardList,
  Truck,
} from "lucide-react";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { MobileHeader } from "@/components/shared/mobile-header";

const supplierNavItems = [
  { title: "Dashboard", href: "/supplier/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/supplier/products", icon: Package },
  { title: "Offers", href: "/supplier/offers", icon: Tag },
  { title: "Orders", href: "/supplier/orders", icon: ClipboardList },
  { title: "Delivery", href: "/supplier/delivery", icon: Truck },
];

export function SupplierSidebar() {
  return (
    <>
      <SidebarNav items={supplierNavItems} title="ProcureLink" />
      <MobileHeader items={supplierNavItems} title="ProcureLink" />
    </>
  );
}
