"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toggleRecurringOrder,
  deleteRecurringOrder,
} from "@/lib/actions/recurring-orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ISO_DAYS_FULL } from "@/lib/constants";
import {
  Pause,
  Play,
  Trash2,
  Pencil,
  Loader2,
  CalendarClock,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Item {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface Run {
  id: string;
  status: string;
  error_message: string | null;
  run_at: string | null;
  order_id: string | null;
  order_number?: string | null;
}

interface RecurringOrderData {
  id: string;
  name: string;
  frequency: string;
  schedule_days: number[];
  delivery_offset_days: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  created_at: string | null;
  supplier_name: string;
  items: Item[];
  runs: Run[];
}

function getOrdinalSuffix(n: number) {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function scheduleSummary(frequency: string, days: number[]): string {
  if (frequency === "daily") return "Every day";
  if (!days || days.length === 0) return "Not configured";
  if (frequency === "weekly") {
    return days
      .map((d) => ISO_DAYS_FULL.find((i) => i.value === d)?.label ?? "")
      .join(", ");
  }
  return (
    days.map((d) => `${d}${getOrdinalSuffix(d)}`).join(", ") + " of each month"
  );
}

export function RecurringOrderDetail({ order }: { order: RecurringOrderData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const estimatedTotal = order.items.reduce(
    (s, i) => s + i.unit_price * i.quantity,
    0,
  );

  async function handleToggle() {
    setLoading("toggle");
    await toggleRecurringOrder(order.id, !order.is_active);
    setLoading(null);
  }

  async function handleDelete() {
    if (!confirm("Delete this automation permanently?")) return;
    setLoading("delete");
    await deleteRecurringOrder(order.id);
    router.push("/restaurant/automations");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{order.name}</h1>
            <Badge
              className={
                order.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {order.is_active ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {order.supplier_name}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/restaurant/automations/${order.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={!!loading}
            onClick={handleToggle}
          >
            {loading === "toggle" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : order.is_active ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {order.is_active ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-destructive hover:text-destructive"
            disabled={!!loading}
            onClick={handleDelete}
          >
            {loading === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left column - Items + Run history */}
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-xl border bg-card premium-shadow overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30">
              <h2 className="font-bold text-base">
                Order Items
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""} per order
              </p>
            </div>
            <div className="divide-y">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3.5 text-sm"
                >
                  <div>
                    <span className="font-semibold">{item.product_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      EUR {item.unit_price.toFixed(2)} / {item.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold tabular-nums">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-muted-foreground ml-3 text-xs tabular-nums">
                      EUR {(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between px-5 py-3.5 bg-muted/20 font-bold">
                <span className="text-base">Estimated total</span>
                <span className="text-base tabular-nums">EUR {estimatedTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Run history */}
          <div className="rounded-xl border bg-card premium-shadow overflow-hidden">
            <div className="px-5 py-3.5 border-b bg-muted/30">
              <h2 className="font-bold text-base">Run History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.runs.length} run{order.runs.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
            {order.runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No runs yet. The first order will be placed on the next scheduled date.
              </div>
            ) : (
              <div className="divide-y">
                {order.runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {run.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {run.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      {run.status === "skipped" && (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>
                        {run.run_at
                          ? new Date(run.run_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.status === "success" && run.order_number && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {run.order_number}
                        </span>
                      )}
                      {run.error_message && (
                        <span className="text-xs text-destructive max-w-50 truncate">
                          {run.error_message}
                        </span>
                      )}
                      <Badge
                        className={
                          run.status === "success"
                            ? "bg-green-100 text-green-800 text-[10px]"
                            : run.status === "error"
                              ? "bg-red-100 text-red-800 text-[10px]"
                              : "bg-yellow-100 text-yellow-800 text-[10px]"
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Info sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 h-fit">
          {/* Schedule card */}
          <div className="rounded-xl border bg-card p-5 premium-shadow space-y-4">
            <h3 className="font-bold text-base">Schedule</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {order.frequency === "daily" ? "Daily" : order.frequency === "weekly" ? "Weekly" : "Monthly"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scheduleSummary(order.frequency, order.schedule_days)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    +{order.delivery_offset_days} day{order.delivery_offset_days !== 1 ? "s" : ""} delivery
                  </p>
                  <p className="text-xs text-muted-foreground">
                    After order placement
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {order.is_active && order.next_run_at
                      ? new Date(order.next_run_at + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { weekday: "short", month: "short", day: "numeric" },
                        )
                      : "Not scheduled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.is_active ? "Next run" : "Paused"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active period card */}
          <div className="rounded-xl border bg-card p-5 premium-shadow space-y-2">
            <h3 className="font-bold text-sm">Active Period</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Start</span>
              <span className="font-semibold">
                {order.start_date
                  ? new Date(order.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">End</span>
              <span className="font-semibold">
                {order.end_date
                  ? new Date(order.end_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "No end date"}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-5 premium-shadow space-y-2">
              <h3 className="font-bold text-sm">Notes</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Created date */}
          {order.created_at && (
            <p className="text-xs text-muted-foreground text-center">
              Created {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
