import { describe, expect, it } from "vitest";
import {
  bookingSchema,
  bookingStepFields,
  contactSchema,
  isBookableDate,
  newsletterSchema,
  parseISODate,
  slotsForDate,
  validateReferenceImage,
} from "@/lib/validations";

// 2026-11-16 is a Monday, -21 a Saturday, -22 a Sunday.
const TODAY = "2026-11-16";

const validBooking = {
  name: "Ananya Rao",
  email: "Ananya@Example.com ",
  countryCode: "+91",
  phone: "98450 12345",
  city: "Chennai",
  propertyType: "Apartment",
  area: 1800,
  projectKind: "new",
  budget: "₹30 – 60 lakh",
  style: "Japandi",
  appointmentDate: "2026-11-18",
  timeSlot: "11:30",
  mode: "virtual",
  notes: "",
};

describe("dates", () => {
  it("parses only real calendar dates", () => {
    expect(parseISODate("2026-02-28")).not.toBeNull();
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("18/11/2026")).toBeNull();
  });

  it("allows Monday to Saturday from today up to 90 days out", () => {
    expect(isBookableDate(TODAY, TODAY)).toBe(true);
    expect(isBookableDate("2026-11-21", TODAY)).toBe(true);
    expect(isBookableDate("2026-11-22", TODAY)).toBe(false); // Sunday
    expect(isBookableDate("2026-11-13", TODAY)).toBe(false); // past
    expect(isBookableDate("2027-03-01", TODAY)).toBe(false); // too far ahead
  });

  it("drops the last slot on Saturdays and offers none on Sundays", () => {
    expect(slotsForDate("2026-11-18")).toContain("17:00");
    expect(slotsForDate("2026-11-21")).not.toContain("17:00");
    expect(slotsForDate("2026-11-22")).toEqual([]);
  });
});

describe("booking schema", () => {
  it("accepts a complete request and normalises the email", () => {
    const result = bookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("ananya@example.com");
  });

  it.each([
    ["name", "A"],
    ["email", "not-an-email"],
    ["phone", "abc"],
    ["countryCode", "+999"],
    ["propertyType", "Castle"],
    ["area", 20],
    ["budget", "Lots"],
    ["style", "Baroque"],
    ["appointmentDate", "tomorrow"],
    ["timeSlot", "03:00"],
    ["mode", "telepathy"],
  ])("rejects an invalid %s", (field, value) => {
    const result = bookingSchema.safeParse({ ...validBooking, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  it("rejects a time that is not offered on the chosen day", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      appointmentDate: "2026-11-21",
      timeSlot: "17:00",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["timeSlot"]);
  });

  it("covers every field in exactly one step", () => {
    const fields = bookingStepFields.flat();
    expect(new Set(fields).size).toBe(fields.length);
    expect(fields).toEqual(expect.arrayContaining(["name", "area", "budget", "style", "timeSlot"]));
    expect(bookingStepFields).toHaveLength(5);
  });
});

describe("contact and newsletter schemas", () => {
  const valid = {
    name: "Rahul Mehta",
    email: "rahul@example.com",
    phone: "",
    subject: "Press enquiry",
    message: "I would like to feature the Boat Club Residence in our March issue.",
  };

  it("accepts a valid message with an optional phone", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
    expect(contactSchema.safeParse({ ...valid, phone: "+91 98450 12345" }).success).toBe(true);
  });

  it("requires a meaningful message and a valid email", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Hi" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: "rahul@" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, phone: "call me" }).success).toBe(false);
  });

  it("validates newsletter emails", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("reference image", () => {
  it("accepts small images and rejects other files", () => {
    expect(validateReferenceImage({ size: 1000, type: "image/jpeg" })).toBeNull();
    expect(validateReferenceImage({ size: 1000, type: "application/pdf" })).toMatch(/JPG/);
    expect(validateReferenceImage({ size: 5 * 1024 * 1024, type: "image/png" })).toMatch(/4 MB/);
  });
});
