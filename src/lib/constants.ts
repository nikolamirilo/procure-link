export const APP_NAME = "ProcureLink";

export const ORDER_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Preparing", color: "bg-purple-100 text-purple-800" },
  dispatched: { label: "Dispatched", color: "bg-orange-100 text-orange-800" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
} as const;

export const PAYMENT_STATUSES = {
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  partially_paid: {
    label: "Partially Paid",
    color: "bg-yellow-100 text-yellow-800",
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
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  paused: { label: "Paused", color: "bg-yellow-100 text-yellow-800" },
} as const;
