"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatMoney, formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { ChevronLeft, ChevronRight, Clock, Truck } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string | null;
  delivery_date: string;
  total: number;
  currency: string;
  notes: string | null;
  supplier: { name: string } | null;
  order_items: OrderItem[];
}

function extractDeliveryTime(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Preferred delivery time:\s*(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0
}

export function DeliveryCalendar({ orders }: { orders: Order[] }) {
  const t = useTranslations("calendar");
  const tStatus = useTranslations("orderStatus");
  const td = useTranslations("days");
  const locale = useLocale() as Locale;
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group orders by delivery_date
  const ordersByDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    for (const order of orders) {
      const d = order.delivery_date;
      if (!map[d]) map[d] = [];
      map[d].push(order);
    }
    return map;
  }, [orders]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function goToPrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  }

  function goToNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayStr);
  }

  // Build calendar cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedOrders = selectedDate ? ordersByDate[selectedDate] ?? [] : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Calendar grid */}
        <div className="rounded-2xl border bg-card premium-shadow overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold capitalize">
                {formatDay(new Date(currentYear, currentMonth, 1), "LLLL yyyy", locale)}
              </h2>
              <Button variant="outline" size="sm" className="text-xs h-7 ml-2" onClick={goToToday}>
                {t("today")}
              </Button>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
              >
                {td(`short.${d}`)}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="border-b border-r last:border-r-0 h-20 bg-muted/20" />;
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayOrders = ordersByDate[dateStr] ?? [];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasOrders = dayOrders.length > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative h-20 border-b border-r last:border-r-0 p-1.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/5 ring-2 ring-inset ring-primary/30"
                      : hasOrders
                        ? "hover:bg-muted/50"
                        : "hover:bg-muted/30"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : isSelected
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {hasOrders && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayOrders.slice(0, 2).map((order) => {
                        const statusInfo =
                          ORDER_STATUSES[
                            (order.status ?? "pending") as keyof typeof ORDER_STATUSES
                          ];
                        return (
                          <div
                            key={order.id}
                            className={`text-[9px] font-medium leading-tight truncate rounded px-1 py-0.5 ${statusInfo.color}`}
                          >
                            {order.supplier?.name}
                          </div>
                        );
                      })}
                      {dayOrders.length > 2 && (
                        <p className="text-[9px] text-muted-foreground px-1">
                          {t("more", { count: dayOrders.length - 2 })}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border bg-card premium-shadow overflow-hidden h-fit lg:sticky lg:top-6">
          <div className="px-5 py-4 border-b bg-muted/30">
            <h3 className="font-semibold text-sm capitalize">
              {selectedDate
                ? formatDay(selectedDate + "T00:00:00", "EEEE, d. MMMM", locale)
                : t("selectDate")}
            </h3>
            {selectedDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("deliveries", { count: selectedOrders.length })}
              </p>
            )}
          </div>

          <div className="p-4">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("clickDate")}</p>
            ) : selectedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("noDeliveries")}</p>
            ) : (
              <div className="space-y-3">
                {selectedOrders.map((order) => {
                  const statusInfo =
                    ORDER_STATUSES[
                      (order.status ?? "pending") as keyof typeof ORDER_STATUSES
                    ];
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border p-3.5 space-y-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              {order.supplier?.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              {order.order_number}
                            </p>
                            {extractDeliveryTime(order.notes) && (
                              <p className="text-[11px] text-primary flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {extractDeliveryTime(order.notes)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={statusInfo.color + " text-[10px] shrink-0"}>
                          {tStatus((order.status ?? "pending") as keyof typeof ORDER_STATUSES)}
                        </Badge>
                      </div>
                      {order.order_items.length > 0 && (
                        <div className="pl-10 space-y-1">
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted/40 text-muted-foreground">
                                  <th className="text-left py-1.5 px-2 font-medium">{t("thItem")}</th>
                                  <th className="text-right py-1.5 px-2 font-medium">{t("thQty")}</th>
                                  <th className="text-right py-1.5 px-2 font-medium">{t("thPrice")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.order_items.map((item) => (
                                  <tr key={item.id} className="border-t">
                                    <td className="py-1.5 px-2 truncate max-w-35">{item.product_name}</td>
                                    <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                      {item.quantity} {item.unit}
                                    </td>
                                    <td className="py-1.5 px-2 text-right whitespace-nowrap">
                                      {formatMoney(item.total_price, order.currency, locale)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pl-10 pt-1 border-t border-dashed mt-1">
                        <span className="text-xs text-muted-foreground">{t("total")}</span>
                        <span className="text-sm font-bold">
                          {formatMoney(order.total, order.currency, locale)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="font-medium mr-1">{t("legend")}</span>
        {Object.entries(ORDER_STATUSES).map(([key, val]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${val.color}`} />
            {tStatus(key as keyof typeof ORDER_STATUSES)}
          </span>
        ))}
      </div>
    </div>
  );
}
