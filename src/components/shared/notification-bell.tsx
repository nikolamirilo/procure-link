"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { Bell, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

export function NotificationBell() {
  const t = useTranslations("notificationsPanel");
  const locale = useLocale() as Locale;
  const [items, setItems] = useState<Notification[]>([]);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(data ?? []);
  }, [supabase]);

  useEffect(() => {
    // Fetch notifications on mount; setState happens after the async load, not
    // as a synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const unread = items.filter((i) => !i.is_read).length;

  async function markAll() {
    const ids = items.filter((i) => !i.is_read).map((i) => i.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: true } : i)));
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger
        aria-label={t("title")}
        className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="flex-1 text-left">{t("title")}</span>
        {unread > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold bg-sidebar-primary text-sidebar-primary-foreground">
            {unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> {t("markAllRead")}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("empty")}</p>
        ) : (
          <div className="divide-y">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => markOne(n.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${n.is_read ? "opacity-60" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    {n.created_at && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDay(n.created_at, "d. MMM yyyy.", locale)}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
