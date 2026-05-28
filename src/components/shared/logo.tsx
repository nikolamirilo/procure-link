import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  textClassName?: string;
  variant?: "default" | "sidebar" | "light";
}

const sizes = {
  sm: { icon: "h-8 w-8", textSize: "h-4 w-4", label: "text-base" },
  md: { icon: "h-10 w-10", textSize: "h-5 w-5", label: "text-xl" },
  lg: { icon: "h-12 w-12", textSize: "h-6 w-6", label: "text-2xl" },
  xl: { icon: "h-16 w-16", textSize: "h-8 w-8", label: "text-4xl" },
};

export function Logo({
  size = "md",
  showText = true,
  className,
  textClassName,
  variant = "default",
}: LogoProps) {
  const s = sizes[size];

  const iconBg =
    variant === "sidebar"
      ? "bg-sidebar-primary shadow-sidebar-primary/20"
      : variant === "light"
        ? "bg-white/10 backdrop-blur-md border border-white/20"
        : "bg-primary shadow-primary/20";

  const iconColor = variant === "light" ? "text-white" : "text-white";

  const labelColor =
    variant === "sidebar"
      ? "text-sidebar-foreground"
      : variant === "light"
        ? "text-white"
        : "text-slate-900 dark:text-white";

  return (
    <div className={cn("flex items-center gap-3 group", className)}>
      {/* Icon Container */}
      <div
        className={cn(
          s.icon,
          iconBg,
          "relative flex items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3",
        )}
      >
        {/* Abstract "P" + Link Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(s.textSize, iconColor, "z-10")}
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>

        {/* Decorative Gloss Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-xl" />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className={cn("flex items-baseline", labelColor, textClassName)}>
          <span className={cn("font-extrabold tracking-tight", s.label)}>
            Procure
          </span>
          <span className={cn("font-light tracking-tight opacity-80", s.label)}>
            Link
          </span>
        </div>
      )}
    </div>
  );
}
