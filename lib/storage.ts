import "server-only";

/**
 * Persistence for form submissions.
 *
 * With DATABASE_URL set, records go to PostgreSQL through Prisma. Without it
 * (first run, local demos) they are appended to JSON files in `.data/`, so the
 * forms work end to end before a database exists. The fallback is for local
 * development only: serverless hosts have a read-only filesystem.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { databaseEnabled, getPrisma } from "@/lib/prisma";
import type { BookingInput, ContactInput } from "@/lib/validations";

const DATA_DIR = path.join(process.cwd(), ".data");

async function readLocal<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, file), "utf8")) as T[];
  } catch {
    return [];
  }
}

async function appendLocal<T extends object>(file: string, record: T): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const records = await readLocal<T>(file);
  records.push(record);
  await writeFile(path.join(DATA_DIR, file), JSON.stringify(records, null, 2), "utf8");
}

export interface ConsultationRecord extends BookingInput {
  referenceImage?: string;
}

interface LocalConsultation extends ConsultationRecord {
  id: string;
  status: string;
  createdAt: string;
}

export async function saveConsultation(data: ConsultationRecord): Promise<{ id: string }> {
  if (databaseEnabled) {
    const record = await getPrisma().consultation.create({
      data: {
        name: data.name,
        email: data.email,
        phone: `${data.countryCode} ${data.phone}`,
        city: data.city,
        propertyType: data.propertyType,
        projectKind: data.projectKind,
        area: data.area,
        budget: data.budget,
        style: data.style,
        appointmentDate: new Date(`${data.appointmentDate}T00:00:00.000Z`),
        timeSlot: data.timeSlot,
        mode: data.mode,
        notes: data.notes || null,
        referenceImage: data.referenceImage ?? null,
      },
      select: { id: true },
    });
    return record;
  }
  const id = randomUUID();
  await appendLocal<LocalConsultation>("consultations.json", {
    id,
    ...data,
    status: "NEW",
    createdAt: new Date().toISOString(),
  });
  return { id };
}

/** Time slots already taken on a given day ("YYYY-MM-DD"). */
export async function getBookedSlots(date: string): Promise<string[]> {
  if (databaseEnabled) {
    const rows = await getPrisma().consultation.findMany({
      where: { appointmentDate: new Date(`${date}T00:00:00.000Z`), status: { not: "CANCELLED" } },
      select: { timeSlot: true },
    });
    return rows.map((row) => row.timeSlot);
  }
  const rows = await readLocal<LocalConsultation>("consultations.json");
  return rows
    .filter((row) => row.appointmentDate === date && row.status !== "CANCELLED")
    .map((row) => row.timeSlot);
}

export async function saveContactMessage(data: ContactInput): Promise<{ id: string }> {
  if (databaseEnabled) {
    return getPrisma().contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
      },
      select: { id: true },
    });
  }
  const id = randomUUID();
  await appendLocal("contact-messages.json", { id, ...data, createdAt: new Date().toISOString() });
  return { id };
}

export async function saveSubscriber(email: string): Promise<void> {
  if (databaseEnabled) {
    await getPrisma().newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    return;
  }
  const existing = await readLocal<{ email: string }>("subscribers.json");
  if (existing.some((row) => row.email === email)) return;
  await appendLocal("subscribers.json", { email, createdAt: new Date().toISOString() });
}

/** Keep an uploaded reference image next to the local records (dev fallback only). */
export async function saveLocalUpload(id: string, file: File): Promise<void> {
  const dir = path.join(DATA_DIR, "uploads");
  await mkdir(dir, { recursive: true });
  const extension = file.type.split("/")[1] ?? "bin";
  await writeFile(path.join(dir, `${id}.${extension}`), Buffer.from(await file.arrayBuffer()));
}
