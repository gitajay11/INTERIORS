import "server-only";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Spam protection used by every form action:
 *  1. honeypot field (checked in the action itself)
 *  2. per-IP rate limiting (below)
 *  3. Cloudflare Turnstile, when keys are configured
 */

export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

// ---- Turnstile --------------------------------------------------------------
export const turnstileEnabled = Boolean(
  process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!turnstileEnabled) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    });
    if (ip !== "unknown") body.set("remoteip", ip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const result = (await response.json()) as { success: boolean };
    return result.success === true;
  } catch (error) {
    console.error("[turnstile] verification failed", error);
    return false;
  }
}

/**
 * Run the shared checks. Returns an error message for the user, or null when
 * the request may proceed.
 */
export async function guard(action: string, turnstileToken?: string): Promise<string | null> {
  const ip = await clientIp();
  if (!rateLimit(`${action}:${ip}`, 5, 10 * 60_000)) {
    return "Too many requests. Please wait a few minutes and try again.";
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return "We could not verify that you are human. Please retry the check and submit again.";
  }
  return null;
}
