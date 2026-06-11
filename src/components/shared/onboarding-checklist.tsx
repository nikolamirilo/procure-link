import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChecklistItem {
  label: string;
  done: boolean;
  href: string;
}

/**
 * First-steps checklist shown on the dashboard until every step is complete.
 * Each row links straight to the action - it converts "what now?" after
 * onboarding into a three-minute setup path. Server component.
 */
export function OnboardingChecklist({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: ChecklistItem[];
}) {
  if (items.every((i) => i.done)) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="rounded-2xl border bg-card p-5 premium-shadow space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-xs font-bold tabular-nums text-muted-foreground shrink-0">
          {doneCount}/{items.length}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>
      <ol className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                item.done
                  ? "text-muted-foreground line-through"
                  : "hover:bg-muted/50 font-medium"
              )}
            >
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1">{item.label}</span>
              {!item.done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
