import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Open-redirect guard. Only allows same-origin in-app paths (a single leading
 * slash, not "//host" or "/\host" and no scheme). Anything else falls back to
 * the provided default. Use for any user-supplied `next=`/redirect param.
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/"
): string {
  if (!next) return fallback;
  // Must start with a single slash and not be protocol-relative or backslash.
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.includes("://")) return fallback;
  return next;
}
