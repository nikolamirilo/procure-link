"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { srLatn, enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDay } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

function toIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// day index, 0 = Monday .. 6 = Sunday (matches delivery_slots.day_of_week)
function dayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/**
 * Date picker that only allows days the supplier actually delivers on.
 * `availableDays` is a list of 0=Mon..6=Sun; empty means the supplier has no
 * published slots, so any future day is allowed.
 */
export function DeliveryDatePicker({
  value,
  onChange,
  availableDays,
}: {
  value: string;
  onChange: (value: string) => void;
  availableDays: number[];
}) {
  const t = useTranslations("cart");
  const td = useTranslations("days");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const dfLocale = locale === "sr" ? srLatn : enUS;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isDisabled(date: Date) {
    if (date < today) return true;
    if (availableDays.length === 0) return false;
    return !availableDays.includes(dayIndex(date));
  }

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "h-9 w-full flex items-center gap-2 rounded-lg border px-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          {value ? formatDay(value + "T00:00:00", "d. MMM yyyy.", locale) : t("pickDate")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? today}
            disabled={isDisabled}
            locale={dfLocale}
            onSelect={(d?: Date) => {
              if (d) {
                onChange(toIso(d));
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
      <p className="text-[10px] text-muted-foreground">
        {availableDays.length > 0
          ? `${t("deliversOn")} ${availableDays
              .slice()
              .sort((a, b) => a - b)
              .map((d) => td(`short.${d + 1}`))
              .join(", ")}`
          : t("deliversAnyDay")}
      </p>
    </div>
  );
}
