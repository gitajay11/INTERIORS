/**
 * Development helper: capture a page with headless Chromium.
 *   pnpm exec tsx scripts/shot.ts /studio out.png [width] [height] [--full] [--dark] [--wait=ms]
 */
import { chromium } from "@playwright/test";

const [url, out, width = "1440", height = "900"] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const flag = (name: string) => process.argv.includes(`--${name}`);
const wait = Number(process.argv.find((arg) => arg.startsWith("--wait="))?.split("=")[1] ?? 2500);

async function main() {
  const browser = await chromium.launch({
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: Number(width), height: Number(height) },
    colorScheme: flag("dark") ? "dark" : "light",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("page error:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("console error:", message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) console.error(response.status(), response.url());
  });
  await page.goto(`${process.env.SHOT_BASE_URL ?? "http://localhost:3000"}${url}`, { waitUntil: "load" });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out, fullPage: flag("full") });
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
