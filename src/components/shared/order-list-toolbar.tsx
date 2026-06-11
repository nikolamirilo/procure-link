"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

export type OrderStatusFilter =
  | "all"
  | "pending"
  | "active"
  | "delivered"
  | "cancelled";

export const ACTIVE_STATUSES = ["confirmed", "preparing", "dispatched"];

/** Returns true when the order passes the status chip + search text. */
export function matchesOrderFilters(
  order: { order_number: string; status: string | null },
  partyName: string,
  filter: OrderStatusFilter,
  search: string
): boolean {
  const status = order.status ?? "pending";
  if (filter === "pending" && status !== "pending") return false;
  if (filter === "active" && !ACTIVE_STATUSES.includes(status)) return false;
  if (filter === "delivered" && status !== "delivered") return false;
  if (filter === "cancelled" && status !== "cancelled") return false;
  if (search) {
    const q = search.toLowerCase();
    if (
      !order.order_number.toLowerCase().includes(q) &&
      !partyName.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Status chips + free-text search shared by both order lists. An order list
 * is a work queue - "show me what's pending" must be one click.
 */
export function OrderListToolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  pendingCount,
}: {
  filter: OrderStatusFilter;
  onFilterChange: (f: OrderStatusFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  pendingCount?: number;
}) {
  const t = useTranslations("orders");
  const tStatus = useTranslations("orderStatus");
  const tCommon = useTranslations("common");

  const chips: { key: OrderStatusFilter; label: string; badge?: number }[] = [
    { key: "all", label: tCommon("all") },
    { key: "pending", label: tStatus("pending"), badge: pendingCount },
    { key: "active", label: t("filterActive") },
    { key: "delivered", label: tStatus("delivered") },
    { key: "cancelled", label: tStatus("cancelled") },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex gap-2 flex-wrap">
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onFilterChange(chip.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
              filter === chip.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {chip.label}
            {chip.badge !== undefined && chip.badge > 0 && (
              <span
                className={`inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9px] font-bold ${
                  filter === chip.key
                    ? "bg-white/25 text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {chip.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative sm:ml-auto sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-8 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Simple client-side pager. Lists are small pre-launch; revisit at scale. */
export function ListPagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
}) {
  const t = useTranslations("common");
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t("previous")}
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {t("pageOf", { page, pages: pageCount })}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {t("next")}
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
