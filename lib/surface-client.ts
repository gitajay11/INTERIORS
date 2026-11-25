/**
 * Generates procedural surfaces without blocking the page.
 *
 * The work is handed to a single shared Web Worker (`surface.worker.ts`). Where
 * workers are unavailable (old browsers, tests, a blocked worker script) it
 * falls back to generating on the calling thread, so callers never need to care.
 *
 * It is used by the 2D swatch thumbnails.
 */
import { generateSurface, type SurfacePixels, type SurfaceSpec } from "./surfaces";
import type { SurfaceJob, SurfaceResult } from "./surface.worker";

interface Pending {
  spec: SurfaceSpec;
  size: number;
  resolve: (pixels: SurfacePixels) => void;
}

let worker: Worker | null | undefined; // undefined = not tried yet, null = unavailable
let nextId = 0;
const jobs = new Map<number, Pending>();

/** The worker failed: finish everything that was queued on the calling thread instead. */
function abandonWorker() {
  worker?.terminate();
  worker = null;
  for (const job of jobs.values()) job.resolve(generateSurface(job.spec, job.size));
  jobs.clear();
}

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === "undefined") return (worker = null);
  try {
    worker = new Worker(new URL("./surface.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<SurfaceResult>) => {
      const { id, ...pixels } = event.data;
      const job = jobs.get(id);
      if (!job) return;
      jobs.delete(id);
      job.resolve({ size: job.size, ...pixels });
    };
    worker.onerror = abandonWorker;
  } catch {
    worker = null;
  }
  return worker;
}

/** `generateSurface`, off the main thread. Resolves with the same pixel data. */
export function generateSurfaceAsync(spec: SurfaceSpec, size = 512): Promise<SurfacePixels> {
  return new Promise((resolve) => {
    const target = getWorker();
    if (!target) {
      resolve(generateSurface(spec, size));
      return;
    }
    const id = nextId++;
    jobs.set(id, { spec, size, resolve });
    target.postMessage({ id, spec, size } satisfies SurfaceJob);
  });
}
