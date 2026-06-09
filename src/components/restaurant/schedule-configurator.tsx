"use client";

import { useTranslations } from "next-intl";
import { ISO_DAYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScheduleConfiguratorProps {
  frequency: "daily" | "weekly" | "monthly";
  scheduleDays: number[];
  onFrequencyChange: (f: "daily" | "weekly" | "monthly") => void;
  onScheduleDaysChange: (days: number[]) => void;
}

export function ScheduleConfigurator({
  frequency,
  scheduleDays,
  onFrequencyChange,
  onScheduleDaysChange,
}: ScheduleConfiguratorProps) {
  const t = useTranslations("recurring");
  const td = useTranslations("days");

  function toggleDay(day: number) {
    if (scheduleDays.includes(day)) {
      onScheduleDaysChange(scheduleDays.filter((d) => d !== day));
    } else {
      onScheduleDaysChange([...scheduleDays, day].sort((a, b) => a - b));
    }
  }

  function getSummary() {
    if (frequency === "daily") return t("everyDay");
    if (scheduleDays.length === 0) return t("noDaysSelected");
    if (frequency === "weekly") {
      return scheduleDays.map((d) => td(String(d))).join(", ");
    }
    return scheduleDays.map((d) => `${d}.`).join(", ") + t("ofEachMonth");
  }

  return (
    <div className="space-y-4">
      {/* Frequency toggle */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => {
            onFrequencyChange("daily");
            onScheduleDaysChange([]);
          }}
          className={cn(
            "flex-1 py-2 text-sm font-medium cursor-pointer transition-colors",
            frequency === "daily"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {t("daily")}
        </button>
        <button
          type="button"
          onClick={() => {
            onFrequencyChange("weekly");
            onScheduleDaysChange([]);
          }}
          className={cn(
            "flex-1 py-2 text-sm font-medium cursor-pointer transition-colors",
            frequency === "weekly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {t("weekly")}
        </button>
        <button
          type="button"
          onClick={() => {
            onFrequencyChange("monthly");
            onScheduleDaysChange([]);
          }}
          className={cn(
            "flex-1 py-2 text-sm font-medium cursor-pointer transition-colors",
            frequency === "monthly"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {t("monthly")}
        </button>
      </div>

      {/* Day picker */}
      {frequency === "daily" ? (
        <p className="text-sm text-muted-foreground py-2">{t("dailyBody")}</p>
      ) : frequency === "weekly" ? (
        <div className="flex gap-1.5 flex-wrap">
          {ISO_DAYS.map((day) => {
            const selected = scheduleDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  "h-10 w-12 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {td(`short.${day.value}`)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const selected = scheduleDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "h-9 rounded-lg text-xs font-semibold cursor-pointer transition-all",
                  selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {getSummary()}
      </p>
    </div>
  );
}
