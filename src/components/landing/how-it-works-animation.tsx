"use client";

import { Search, ShoppingCart, Truck, Repeat } from "lucide-react";

const steps = [
  { icon: Search, label: "Browse", color: "from-blue-500 to-cyan-500" },
  { icon: ShoppingCart, label: "Order", color: "from-primary to-blue-500" },
  { icon: Truck, label: "Receive", color: "from-emerald-500 to-teal-500" },
  { icon: Repeat, label: "Automate", color: "from-violet-500 to-primary" },
];

export function HowItWorksAnimation() {
  return (
    <div className="relative w-full max-w-105 mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent -m-4" />

      <div className="relative rounded-2xl border bg-card p-8 premium-shadow space-y-6">
        {/* Fake app header */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="h-3 w-3 rounded-full bg-red-400" />
          <div className="h-3 w-3 rounded-full bg-yellow-400" />
          <div className="h-3 w-3 rounded-full bg-green-400" />
          <div className="flex-1 mx-4 h-6 rounded-md bg-muted" />
        </div>

        {/* Step flow */}
        <div className="space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.label}
                className="flex items-center gap-4 group"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{step.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${step.color} animate-pulse`}
                      style={{ width: `${100 - i * 10}%` }}
                    />
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute left-[2.1rem] mt-16 h-4 w-px bg-border hidden" />
                )}
              </div>
            );
          })}
        </div>

        {/* Fake order summary card */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Weekly Auto-Order
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              Active
            </span>
          </div>
          <div className="space-y-2">
            {["Fresh Tomatoes - 10 kg", "Olive Oil - 5 L", "Mozzarella - 3 kg"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{item}</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
              )
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">Next delivery</span>
            <span className="text-xs font-semibold">Tomorrow, 8:00 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
