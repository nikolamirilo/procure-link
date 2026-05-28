"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { LogOut, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Logo } from "@/components/shared/logo";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarNavProps {
  items: NavItem[];
  title: string;
}

export function SidebarNav({ items, title }: SidebarNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex h-screen w-[260px] flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
        <Logo variant="sidebar" textClassName="text-base" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Menu
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.title}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-white/20 text-sidebar-primary-foreground"
                      : "bg-sidebar-primary/80 text-sidebar-primary-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Bell className="h-[18px] w-[18px]" />
          Notifications
        </Link>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            size="sm"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  );
}
