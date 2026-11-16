"use server";

/**
 * Server Actions for every form on the site. Each action:
 *   honeypot → rate limit + Turnstile → Zod validation → save → email.
 * They never throw to the client; failures come back as `{ ok: false, error }`.
 */
import { decodeConfig, describeConfig } from "@/lib/design-config";
import {
  ConsultationConfirmationEmail,
  ConsultationNotificationEmail,
  ContactAcknowledgementEmail,
  ContactNotificationEmail,
  STUDIO_INBOX,
  sendEmail,
  type ConsultationEmailData,
} from "@/lib/email";
import { databaseEnabled } from "@/lib/prisma";
import { site } from "@/lib/site";
import { guard } from "@/lib/spam";
import {
  getBookedSlots,
  saveConsultation,
  saveContactMessage,
  saveLocalUpload,
  saveSubscriber,
} from "@/lib/storage";
import {
  bookingSchema,
  contactSchema,
  isBookableDate,
  newsletterSchema,
  validateReferenceImage,
} from "@/lib/validations";

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const GENERIC_ERROR = `Something went wrong on our side. Please try again, or email ${site.email}.`;

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

// ---- Consultation booking ---------------------------------------------------
export interface BookingSuccess {
  id: string;
  emailSent: boolean;
}

/**
 * Expects FormData with:
 *   payload    JSON string matching `bookingSchema`
 *   reference  optional image file
 *   company    honeypot (must be empty)
 *   turnstile  Turnstile token (when configured)
 */
export async function submitConsultation(
  formData: FormData,
): Promise<ActionResult<BookingSuccess>> {
  try {
    // Bots fill every field; real users never see this one. Pretend it worked.
    if (formData.get("company")) return { ok: true, data: { id: "ok", emailSent: false } };

    const blocked = await guard("booking", formData.get("turnstile")?.toString());
    if (blocked) return { ok: false, error: blocked };

    let payload: unknown;
    try {
      payload = JSON.parse(String(formData.get("payload") ?? ""));
    } catch {
      return {
        ok: false,
        error: "The form data could not be read. Please reload the page and try again.",
      };
    }
    const parsed = bookingSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }
    const data = parsed.data;

    // Server-side date rules (one day of slack for visitors ahead of the server's time zone).
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (!isBookableDate(data.appointmentDate, yesterday)) {
      return {
        ok: false,
        error: "Please choose a different date.",
        fieldErrors: {
          appointmentDate: "Appointments are available Monday to Saturday, up to 90 days ahead",
        },
      };
    }
    if ((await getBookedSlots(data.appointmentDate)).includes(data.timeSlot)) {
      return {
        ok: false,
        error: "That time has just been taken.",
        fieldErrors: { timeSlot: "This slot is no longer available — please pick another" },
      };
    }

    const file = formData.get("reference");
    const reference = file instanceof File && file.size > 0 ? file : null;
    if (reference) {
      const problem = validateReferenceImage(reference);
      if (problem) return { ok: false, error: problem, fieldErrors: { reference: problem } };
    }

    const design = data.designConfig ? decodeConfig(new URLSearchParams(data.designConfig)) : null;
    const designSummary = design ? describeConfig(design) : undefined;

    const { id } = await saveConsultation({
      ...data,
      designSummary,
      referenceImage: reference?.name,
    });
    if (reference && !databaseEnabled) await saveLocalUpload(id, reference);

    const emailData: ConsultationEmailData = {
      id,
      name: data.name,
      email: data.email,
      phone: `${data.countryCode} ${data.phone}`,
      city: data.city,
      propertyType: data.propertyType,
      projectKind: data.projectKind,
      area: data.area,
      budget: data.budget,
      style: data.style,
      date: new Date(`${data.appointmentDate}T00:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      timeSlot: data.timeSlot,
      mode: data.mode,
      notes: data.notes || undefined,
      designSummary,
      designUrl:
        design && data.designConfig ? `${site.url}/studio?${data.designConfig}` : undefined,
    };

    const [emailSent] = await Promise.all([
      sendEmail({
        to: data.email,
        subject: `Your consultation with ${site.name}`,
        react: ConsultationConfirmationEmail({ data: emailData }),
        replyTo: STUDIO_INBOX,
      }),
      sendEmail({
        to: STUDIO_INBOX,
        subject: `New consultation: ${data.name} — ${emailData.date}, ${data.timeSlot}`,
        react: ConsultationNotificationEmail({ data: emailData }),
        replyTo: data.email,
        // The studio receives the client's reference image as an attachment.
        attachments: reference
          ? [{ filename: reference.name, content: Buffer.from(await reference.arrayBuffer()) }]
          : undefined,
      }),
    ]);

    return { ok: true, data: { id, emailSent } };
  } catch (error) {
    console.error("[booking] failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// ---- Contact ----------------------------------------------------------------
export interface ContactPayload {
  values: unknown;
  /** Honeypot. */
  company?: string;
  turnstile?: string;
}

export async function submitContact(
  payload: ContactPayload,
): Promise<ActionResult<{ emailSent: boolean }>> {
  try {
    if (payload.company) return { ok: true, data: { emailSent: false } };

    const blocked = await guard("contact", payload.turnstile);
    if (blocked) return { ok: false, error: blocked };

    const parsed = contactSchema.safeParse(payload.values);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please check the highlighted fields.",
        fieldErrors: fieldErrors(parsed.error.issues),
      };
    }
    const data = { ...parsed.data, phone: parsed.data.phone || undefined };

    await saveContactMessage(data);
    const [emailSent] = await Promise.all([
      sendEmail({
        to: STUDIO_INBOX,
        subject: `Enquiry: ${data.subject}`,
        react: ContactNotificationEmail({ data }),
        replyTo: data.email,
      }),
      sendEmail({
        to: data.email,
        subject: `We have received your message — ${site.name}`,
        react: ContactAcknowledgementEmail({ data }),
        replyTo: STUDIO_INBOX,
      }),
    ]);
    return { ok: true, data: { emailSent } };
  } catch (error) {
    console.error("[contact] failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// ---- Newsletter -------------------------------------------------------------
export async function subscribeNewsletter(email: string, company?: string): Promise<ActionResult> {
  try {
    if (company) return { ok: true, data: undefined };
    const blocked = await guard("newsletter");
    if (blocked) return { ok: false, error: blocked };
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success)
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email" };
    await saveSubscriber(parsed.data.email);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("[newsletter] failed", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
