/**
 * Zod schemas shared by the client forms (React Hook Form) and the server
 * actions, so both sides enforce exactly the same rules.
 */
import { z } from "zod";

// ---- Option lists (also drive the form UI) ----------------------------------
export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Office",
  "Retail",
  "Restaurant",
  "Other",
] as const;
export const PROJECT_KINDS = ["new", "renovation"] as const;
export const BUDGET_RANGES = [
  "Under ₹15 lakh",
  "₹15 – 30 lakh",
  "₹30 – 60 lakh",
  "₹60 lakh – 1 crore",
  "₹1 – 2 crore",
  "Above ₹2 crore",
] as const;
export const DESIGN_STYLES = [
  "Modern",
  "Minimal",
  "Contemporary",
  "Traditional",
  "Industrial",
  "Scandinavian",
  "Japandi",
  "Luxury",
] as const;
export const TIME_SLOTS = ["10:00", "11:30", "14:00", "15:30", "17:00"] as const;
export const MEETING_MODES = ["in-studio", "virtual"] as const;
export const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+61", label: "Australia (+61)" },
] as const;

// ---- Shared fields ----------------------------------------------------------
const name = z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long");
const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const phoneDigits = z
  .string()
  .trim()
  .regex(/^[0-9][0-9\s-]{5,14}$/, "Enter a valid phone number (digits only)");

// ---- Dates ------------------------------------------------------------------
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse "YYYY-MM-DD" as a calendar date (UTC midnight), or null if invalid. */
export function parseISODate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    ? date
    : null;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * The studio takes appointments Monday–Saturday, from today up to 90 days out.
 * `today` is "YYYY-MM-DD" in the visitor's (or server's) calendar.
 */
export function isBookableDate(value: string, today: string): boolean {
  const date = parseISODate(value);
  const start = parseISODate(today);
  if (!date || !start) return false;
  if (date.getUTCDay() === 0) return false; // Sunday
  const days = (date.getTime() - start.getTime()) / 86_400_000;
  return days >= 0 && days <= 90;
}

/** Saturday closes at 17:00, so the last slot is not offered. */
export function slotsForDate(value: string): string[] {
  const date = parseISODate(value);
  if (!date || date.getUTCDay() === 0) return [];
  return date.getUTCDay() === 6 ? TIME_SLOTS.filter((slot) => slot !== "17:00") : [...TIME_SLOTS];
}

// ---- Booking (one schema per step, merged for submission) --------------------
export const bookingStepSchemas = [
  z.object({
    name,
    email,
    countryCode: z.enum(COUNTRY_CODES.map((c) => c.code) as [string, ...string[]], {
      error: "Choose a country code",
    }),
    phone: phoneDigits,
    city: z.string().trim().min(2, "Tell us which city the property is in").max(60),
  }),
  z.object({
    propertyType: z.enum(PROPERTY_TYPES, { error: "Choose a property type" }),
    area: z
      .number({ error: "Enter the approximate area" })
      .int("Use a whole number")
      .min(100, "Area should be at least 100 sq.ft")
      .max(100_000, "For projects above 100,000 sq.ft please contact us directly"),
    projectKind: z.enum(PROJECT_KINDS, { error: "Is this a new build or a renovation?" }),
  }),
  z.object({
    budget: z.enum(BUDGET_RANGES, { error: "Choose a budget range" }),
  }),
  z.object({
    style: z.enum(DESIGN_STYLES, { error: "Choose the style closest to your taste" }),
  }),
  z.object({
    appointmentDate: z.string().refine((value) => parseISODate(value) !== null, "Choose a date"),
    timeSlot: z.enum(TIME_SLOTS, { error: "Choose a time" }),
    mode: z.enum(MEETING_MODES, { error: "Choose in-studio or virtual" }),
    notes: z.string().trim().max(1000, "Please keep notes under 1,000 characters").optional(),
  }),
] as const;

export const bookingSchema = bookingStepSchemas[0]
  .extend(bookingStepSchemas[1].shape)
  .extend(bookingStepSchemas[2].shape)
  .extend(bookingStepSchemas[3].shape)
  .extend(bookingStepSchemas[4].shape)
  .extend({
    /** Query-string encoded 3D Studio design (see lib/design-config.ts). */
    designConfig: z.string().max(400).optional(),
  })
  .refine((data) => slotsForDate(data.appointmentDate).includes(data.timeSlot), {
    path: ["timeSlot"],
    message: "That time is not available on the selected day",
  });

export type BookingInput = z.infer<typeof bookingSchema>;

/** Field names validated by each step; used to gate the "Next" button. */
export const bookingStepFields = bookingStepSchemas.map(
  (schema) => Object.keys(schema.shape) as (keyof BookingInput)[],
);

// ---- Contact ----------------------------------------------------------------
export const contactSchema = z.object({
  name,
  email,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{5,16}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "Add a short subject").max(120),
  message: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters)")
    .max(3000, "Please keep your message under 3,000 characters"),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ---- Newsletter -------------------------------------------------------------
export const newsletterSchema = z.object({ email });

// ---- Reference image upload ---------------------------------------------------
export const REFERENCE_IMAGE = {
  maxBytes: 4 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export function validateReferenceImage(file: { size: number; type: string }): string | null {
  if (!REFERENCE_IMAGE.types.includes(file.type as (typeof REFERENCE_IMAGE.types)[number])) {
    return "Upload a JPG, PNG or WebP image";
  }
  if (file.size > REFERENCE_IMAGE.maxBytes) return "Image must be smaller than 4 MB";
  return null;
}
