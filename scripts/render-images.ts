/**
 * Renders the demo imagery from the 3D scenes.
 *
 *   pnpm dev                 # in one terminal
 *   pnpm render:images       # in another (add --only=<project-slug> to limit)
 *
 * For every project in lib/data/projects.ts this captures the cover, gallery
 * and before/after stills from the /render route into public/images/projects/,
 * plus the hero fallback image and the first frame of the home page walkthrough. Re-run it after changing a project's design,
 * the furniture models or the lighting.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { projects } from "../lib/data/projects";
import { SHOT_NAMES } from "../lib/render-shots";

const BASE_URL = process.env.RENDER_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "images");
const only = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1];
const onlyShot = process.argv.find((arg) => arg.startsWith("--shot="))?.split("=")[1];

interface Job {
  url: string;
  file: string;
  width: number;
  height: number;
}

const jobs: Job[] = [];
if (!only || only === "hero") {
  jobs.push({ url: "/render?hero=1", file: "hero.jpg", width: 1920, height: 1080 });
}
if (!only || only === "tour") {
  // First frame of the home page walkthrough, shown while the 3D scene loads.
  jobs.push({ url: "/render?tour=1&at=0", file: "tour-start.jpg", width: 1920, height: 1080 });
}
for (const project of projects) {
  if (only && only !== project.slug) continue;
  for (const shot of SHOT_NAMES) {
    if (onlyShot && onlyShot !== shot) continue;
    jobs.push({
      url: `/render?project=${project.slug}&shot=${shot}`,
      file: path.join("projects", project.slug, `${shot}.jpg`),
      width: 1600,
      height: 1067,
    });
  }
}

async function main() {
  // Prefer the real GPU; Chromium falls back to software rendering without one.
  const browser = await chromium.launch({
    args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: "light" });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.error("  page error:", error.message));

  let done = 0;
  for (const job of jobs) {
    await page.setViewportSize({ width: job.width, height: job.height });
    await page.goto(`${BASE_URL}${job.url}`, { waitUntil: "load" });
    // Hide the loading overlay so it can never be captured mid-fade.
    await page.addStyleTag({ content: '[role="status"]{display:none!important}' });
    await page.waitForFunction(() => window.__renderReady === true, undefined, { timeout: 120_000 });
    await page.waitForTimeout(400);
    const file = path.join(OUT_DIR, job.file);
    await mkdir(path.dirname(file), { recursive: true });
    await page.locator("canvas").screenshot({ path: file, type: "jpeg", quality: 86 });
    done += 1;
    console.log(`[${done}/${jobs.length}] ${job.file}`);
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
