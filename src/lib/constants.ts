export const APP_NAME = "ProcureLink";

/**
 * Status pill styles. Soft tinted backgrounds with a hairline ring read as
 * "state", not "button", and every pair has an explicit dark variant - the
 * old `bg-*-100 text-*-800` pills washed out on dark canvases.
 */
export const ORDER_STATUSES = {
  pending: {
    label: "Pending",
    color:
      "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
  confirmed: {
    label: "Confirmed",
    color:
      "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
  },
  preparing: {
    label: "Preparing",
    color:
      "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20",
  },
  dispatched: {
    label: "Dispatched",
    color:
      "bg-orange-100 text-orange-800 ring-1 ring-inset ring-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20",
  },
  delivered: {
    label: "Delivered",
    color:
      "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  cancelled: {
    label: "Cancelled",
    color:
      "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  },
} as const;

export const PAYMENT_STATUSES = {
  unpaid: {
    label: "Unpaid",
    color:
      "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  },
  paid: {
    label: "Paid",
    color:
      "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  partially_paid: {
    label: "Partially Paid",
    color:
      "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
} as const;

export const PRODUCT_UNITS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "piece", label: "Piece" },
  { value: "liter", label: "Liter (L)" },
  { value: "box", label: "Box" },
  { value: "bunch", label: "Bunch" },
  { value: "pack", label: "Pack" },
] as const;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const ISO_DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;

export const ISO_DAYS_FULL = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

export const AUTOMATION_STATUSES = {
  active: {
    label: "Active",
    color:
      "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  },
  paused: {
    label: "Paused",
    color:
      "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  },
} as const;
