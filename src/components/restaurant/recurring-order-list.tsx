"use client";

import { useState } from "react";
import Link from "next/link";
import {
  toggleRecurringOrder,
  deleteRecurringOrder,
} from "@/lib/actions/recurring-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISO_DAYS_FULL } from "@/lib/constants";
import {
  Repeat,
  Pause,
  Play,
  Trash2,
  ChevronRight,
  Loader2,
  CalendarClock,
} from "lucide-react";

interface RecurringOrder {
  id: string;
  name: string;
  frequency: string;
  schedule_days: number[] | unknown;
  delivery_offset_days: number;
  is_active: boolean;
  next_run_at: string | null;
  supplier_name: string;
  item_count: number;
}

function getOrdinalSuffix(n: number) {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function scheduleSummary(frequency: string, days: number[]): string {
  if (frequency === "daily") return "Every day";
  if (!days || days.length === 0) return "Not configured";
  if (frequency === "weekly") {
    const names = days.map(
      (d) => ISO_DAYS_FULL.find((i) => i.value === d)?.label ?? ""
    );
    return `Every ${names.join(", ")}`;
  }
  const parts = days.map((d) => `${d}${getOrdinalSuffix(d)}`);
  return `${parts.join(", ")} of each month`;
}

export function RecurringOrderList({ orders }: { orders: RecurringOrder[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Repeat className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium text-lg">
          No automations yet
        </p>
        <p className="text-sm text-muted-foreground">
          Save items from your cart as a recurring order to get started
        </p>
      </div>
    );
  }

  async function handleToggle(id: string, isActive: boolean) {
    setLoadingId(id);
    await toggleRecurringOrder(id, !isActive);
    setLoadingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this automation? This cannot be undone.")) return;
    setLoadingId(id);
    await deleteRecurringOrder(id);
    setLoadingId(null);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => {
        const days = Array.isArray(order.schedule_days)
          ? (order.schedule_days as number[])
          : [];
        return (
          <div
            key={order.id}
            className="rounded-2xl border bg-card premium-shadow hover:premium-shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="p-5 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] truncate">
                    {order.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.supplier_name}
                  </p>
                </div>
                <Badge
                  className={
                    order.is_active
                      ? "bg-green-100 text-green-800 text-[10px] shrink-0"
                      : "bg-yellow-100 text-yellow-800 text-[10px] shrink-0"
                  }
                >
                  {order.is_active ? "Active" : "Paused"}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">{scheduleSummary(order.frequency, days)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {order.item_count} item{order.item_count !== 1 ? "s" : ""} ·
                    Deliver +{order.delivery_offset_days}d
                  </span>
                  {order.next_run_at && order.is_active && (
                    <span className="text-muted-foreground">
                      Next:{" "}
                      {new Date(order.next_run_at + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1">
                <Link
                  href={`/restaurant/automations/${order.id}`}
                  className="flex-1 inline-flex items-center justify-center h-8 rounded-lg border text-xs font-medium hover:bg-muted cursor-pointer transition-colors gap-1"
                >
                  View
                  <ChevronRight className="h-3 w-3" />
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 px-2.5"
                  disabled={loadingId === order.id}
                  onClick={() => handleToggle(order.id, order.is_active)}
                >
                  {loadingId === order.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : order.is_active ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {order.is_active ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  disabled={loadingId === order.id}
                  onClick={() => handleDelete(order.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
