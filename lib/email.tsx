import "server-only";

/**
 * Transactional email via Resend + React Email.
 * Without RESEND_API_KEY the message is logged to the server console instead,
 * so the booking and contact flows can be exercised locally.
 */
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactElement, ReactNode } from "react";
import { Resend } from "resend";
import { site } from "@/lib/site";

const FROM = process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`;
export const STUDIO_INBOX = process.env.STUDIO_NOTIFICATION_EMAIL ?? site.email;

interface SendOptions {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
  attachments,
}: SendOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[email] RESEND_API_KEY not set — would send "${subject}" to ${to}`);
    return false;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      react,
      replyTo,
      attachments,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}

// ---- Templates --------------------------------------------------------------
const styles = {
  body: {
    backgroundColor: "#f7f3ec",
    fontFamily: "Helvetica, Arial, sans-serif",
    color: "#2b2926",
  },
  container: {
    backgroundColor: "#fffdf9",
    margin: "32px auto",
    padding: "40px",
    maxWidth: "560px",
  },
  brand: { fontFamily: "Georgia, serif", fontSize: "22px", margin: "0 0 24px" },
  heading: { fontFamily: "Georgia, serif", fontSize: "28px", fontWeight: 400, margin: "0 0 16px" },
  text: { fontSize: "15px", lineHeight: "24px", margin: "0 0 12px" },
  label: {
    fontSize: "12px",
    color: "#6a6258",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    margin: "12px 0 2px",
  },
  value: { fontSize: "15px", margin: 0 },
  hr: { borderColor: "#ddd3c4", margin: "24px 0" },
  small: { fontSize: "12px", color: "#6a6258", lineHeight: "18px" },
};

function Layout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>{site.name}</Text>
          {children}
          <Hr style={styles.hr} />
          <Text style={styles.small}>
            {site.address.street}, {site.address.locality} {site.address.postalCode} · {site.phone}{" "}
            · {site.email}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Rows({ rows }: { rows: [string, string | undefined][] }) {
  return (
    <Section>
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </div>
        ))}
    </Section>
  );
}

export interface ConsultationEmailData {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  propertyType: string;
  projectKind: string;
  area: number;
  budget: string;
  style: string;
  date: string;
  timeSlot: string;
  mode: string;
  notes?: string;
  designSummary?: string;
  designUrl?: string;
}

const consultationRows = (data: ConsultationEmailData): [string, string | undefined][] => [
  [
    "Appointment",
    `${data.date} at ${data.timeSlot} (${data.mode === "virtual" ? "video call" : "at our studio"})`,
  ],
  [
    "Property",
    `${data.propertyType}, ${data.area.toLocaleString("en-IN")} sq.ft, ${data.projectKind === "new" ? "new project" : "renovation"}`,
  ],
  ["City", data.city],
  ["Budget", data.budget],
  ["Preferred style", data.style],
  ["Notes", data.notes],
  ["3D Studio design", data.designSummary],
];

export function ConsultationConfirmationEmail({ data }: { data: ConsultationEmailData }) {
  return (
    <Layout preview={`Your consultation on ${data.date} at ${data.timeSlot}`}>
      <Heading style={styles.heading}>Thank you, {data.name.split(" ")[0]}.</Heading>
      <Text style={styles.text}>
        We have received your consultation request. A member of our team will confirm the
        appointment within one working day.
      </Text>
      <Rows rows={consultationRows(data)} />
      {data.designUrl && (
        <Text style={styles.text}>
          <a href={data.designUrl} style={{ color: "#86642a" }}>
            Open your 3D Studio design
          </a>
        </Text>
      )}
      <Text style={styles.small}>Reference: {data.id}</Text>
    </Layout>
  );
}

export function ConsultationNotificationEmail({ data }: { data: ConsultationEmailData }) {
  return (
    <Layout preview={`New consultation request from ${data.name}`}>
      <Heading style={styles.heading}>New consultation request</Heading>
      <Rows
        rows={[
          ["Client", data.name],
          ["Email", data.email],
          ["Phone", data.phone],
          ...consultationRows(data),
          ["Design link", data.designUrl],
          ["Reference", data.id],
        ]}
      />
    </Layout>
  );
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function ContactNotificationEmail({ data }: { data: ContactEmailData }) {
  return (
    <Layout preview={`${data.name}: ${data.subject}`}>
      <Heading style={styles.heading}>New enquiry</Heading>
      <Rows
        rows={[
          ["From", `${data.name} <${data.email}>`],
          ["Phone", data.phone],
          ["Subject", data.subject],
        ]}
      />
      <Hr style={styles.hr} />
      <Text style={{ ...styles.text, whiteSpace: "pre-wrap" }}>{data.message}</Text>
    </Layout>
  );
}

export function ContactAcknowledgementEmail({ data }: { data: ContactEmailData }) {
  return (
    <Layout preview="We have received your message">
      <Heading style={styles.heading}>Thank you for writing, {data.name.split(" ")[0]}.</Heading>
      <Text style={styles.text}>
        Your message has reached the studio and we will reply within two working days. For anything
        urgent, call us on {site.phone}.
      </Text>
      <Text style={styles.label}>Your message</Text>
      <Text style={{ ...styles.text, whiteSpace: "pre-wrap" }}>{data.message}</Text>
    </Layout>
  );
}
