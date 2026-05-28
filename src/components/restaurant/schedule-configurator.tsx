"use client";

import { ISO_DAYS, ISO_DAYS_FULL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ScheduleConfiguratorProps {
  frequency: "daily" | "weekly" | "monthly";
  scheduleDays: number[];
  onFrequencyChange: (f: "daily" | "weekly" | "monthly") => void;
  onScheduleDaysChange: (days: number[]) => void;
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

export function ScheduleConfigurator({
  frequency,
  scheduleDays,
  onFrequencyChange,
  onScheduleDaysChange,
}: ScheduleConfiguratorProps) {
  function toggleDay(day: number) {
    if (scheduleDays.includes(day)) {
      onScheduleDaysChange(scheduleDays.filter((d) => d !== day));
    } else {
      onScheduleDaysChange([...scheduleDays, day].sort((a, b) => a - b));
    }
  }

  // Human-readable summary
  function getSummary() {
    if (frequency === "daily") return "Every day";
    if (scheduleDays.length === 0) return "No days selected";
    if (frequency === "weekly") {
      const names = scheduleDays.map(
        (d) => ISO_DAYS_FULL.find((i) => i.value === d)?.label ?? ""
      );
      return `Every ${names.join(", ")}`;
    } else {
      const parts = scheduleDays.map((d) => `${d}${getOrdinalSuffix(d)}`);
      return `${parts.join(", ")} of each month`;
    }
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
          Daily
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
          Weekly
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
          Monthly
        </button>
      </div>

      {/* Day picker */}
      {frequency === "daily" ? (
        <p className="text-sm text-muted-foreground py-2">
          Orders will be placed automatically every day.
        </p>
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
                {day.label}
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
