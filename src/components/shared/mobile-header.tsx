"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { NotificationBell } from "@/components/shared/notification-bell";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export function MobileHeader({
  items,
}: {
  items: NavItem[];
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex h-14 items-center justify-between border-b bg-background px-4">
        <Logo size="sm" />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <NotificationBell variant="compact" />
          <button onClick={() => setOpen(!open)} className="p-2 relative">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            {/* Aggregated badge on the burger so pending items are visible
                even with the menu closed. */}
            {!open && items.some((i) => (i.badge ?? 0) > 0) && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-b bg-background px-4 py-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.title}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-primary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
