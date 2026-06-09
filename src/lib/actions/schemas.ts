import { z } from "zod";

/**
 * Central validation layer for server-action inputs. Every mutating action
 * parses its input through one of these before touching the database.
 *
 * Rules enforced here are deliberately strict: no negatives where they make no
 * sense, no NaN, bounded string lengths, real UUIDs. The client form also
 * validates, but the client is not a trust boundary - this is.
 */

const uuid = z.uuid("Invalid id");
const shortText = z.string().trim().min(1).max(200);
const longText = z.string().trim().max(2000);

export const PRODUCT_UNITS = [
  "kg",
  "piece",
  "liter",
  "box",
  "bunch",
  "pack",
] as const;

export const CURRENCIES = ["RSD", "EUR"] as const;

export const cartItemSchema = z.object({
  productId: uuid,
  quantity: z.number().positive("Quantity must be positive").max(100000),
});

export const placeOrderSchema = z.object({
  supplierId: uuid,
  deliverySlotId: uuid.nullable(),
  deliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid delivery date"),
  notes: z.string().trim().max(2000).optional().default(""),
  items: z.array(cartItemSchema).min(1, "Order must contain at least one item"),
  idempotencyKey: uuid.optional(),
});

export const orderStatusSchema = z.object({
  orderId: uuid,
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "dispatched",
    "delivered",
    "cancelled",
  ]),
  cancelReason: z.string().trim().max(500).optional(),
});

export const paymentStatusSchema = z.object({
  orderId: uuid,
  paymentStatus: z.enum(["unpaid", "paid", "partially_paid"]),
  paymentMethod: z.string().trim().max(100).optional(),
  paymentNote: z.string().trim().max(500).optional(),
});

export const productSchema = z.object({
  name: shortText,
  description: longText.optional().default(""),
  categoryId: uuid.nullable().optional(),
  unit: z.enum(PRODUCT_UNITS),
  price: z.number().nonnegative("Price cannot be negative").max(10_000_000),
  minOrderQty: z.number().int().positive().max(100000).default(1),
  isAvailable: z.boolean().default(true),
});

export const deliverySlotSchema = z.object({
  // 0 = Monday .. 6 = Sunday (index into DAYS_OF_WEEK; matches the DB constraint)
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
  zoneName: z.string().trim().max(120).nullable().optional(),
  maxOrders: z.number().int().positive().max(10000).default(20),
  isActive: z.boolean().optional(),
});

export const offerSchema = z.object({
  productId: uuid,
  discountPct: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date"),
});

export const recurringItemSchema = z.object({
  productId: uuid,
  quantity: z.number().positive().max(100000),
});

export const recurringOrderSchema = z.object({
  name: shortText,
  supplierId: uuid,
  frequency: z.enum(["daily", "weekly", "monthly"]),
  scheduleDays: z.array(z.number().int().min(1).max(7)).max(7),
  deliveryOffsetDays: z.number().int().min(0).max(60),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(recurringItemSchema).min(1, "Add at least one item"),
});

export const onboardingSchema = z.object({
  companyName: shortText,
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  companyEmail: z.email().max(200).optional().or(z.literal("")),
  currency: z.enum(CURRENCIES).default("RSD"),
  cuisineType: z.string().trim().max(120).optional(),
});

export const companySettingsSchema = z.object({
  name: shortText,
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.email().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  // Restaurant-only
  cuisineType: z.string().trim().max(120).optional().or(z.literal("")),
  // Supplier-only
  currency: z.enum(CURRENCIES).optional(),
  leadTimeHours: z.number().int().min(0).max(720).optional(),
  minOrderValue: z.number().nonnegative().max(10_000_000).optional(),
});

export const credentialsSchema = z.object({
  email: z.email("Invalid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const signUpSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1).max(120),
  companyType: z.enum(["supplier", "restaurant"]),
});

/** Returns a single human-readable message from a ZodError. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
