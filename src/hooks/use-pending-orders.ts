"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Live count of pending orders for the signed-in supplier. RLS scopes the
 * query to the caller's own company, so no company id is needed client-side.
 *
 * Freshness strategy, cheapest first:
 *  - refetch on tab focus / visibility change
 *  - poll every 60s while the tab is open
 *  - subscribe to Supabase realtime on `orders` (no-op if realtime is not
 *    enabled for the table - the poll still keeps the badge honest)
 */
export function usePendingOrdersCount() {
  const [count, setCount] = useState(0);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (supabaseRef.current == null) {
    supabaseRef.current = createClient();
  }

  const load = useCallback(async () => {
    const { count: c } = await supabaseRef.current!
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setCount(c ?? 0);
  }, []);

  useEffect(() => {
    // setState happens after the async fetch resolves, not as a synchronous
    // cascade (same pattern as notification-bell).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, 60_000);
    const onFocus = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    const supabase = supabaseRef.current!;
    const channel = supabase
      .channel("pending-orders-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      supabase.removeChannel(channel);
    };
  }, [load]);

  return count;
}
