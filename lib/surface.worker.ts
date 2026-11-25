/**
 * Web Worker that generates procedural surface textures off the main thread.
 *
 * A 512 px set costs 50–110 ms of pure computation; a page with dozens of
 * swatches would freeze while they were drawn, so the work happens here.
 */
import { generateSurface, type SurfaceSpec } from "./surfaces";

export interface SurfaceJob {
  id: number;
  spec: SurfaceSpec;
  size: number;
}

export interface SurfaceResult {
  id: number;
  albedo: Uint8ClampedArray<ArrayBuffer>;
  normal: Uint8ClampedArray<ArrayBuffer>;
  roughness: Uint8ClampedArray<ArrayBuffer>;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SurfaceJob>) => void) | null;
  postMessage: (message: SurfaceResult, transfer: Transferable[]) => void;
};

scope.onmessage = (event) => {
  const { id, spec, size } = event.data;
  const pixels = generateSurface(spec, size);
  // Transfer the buffers instead of copying them.
  scope.postMessage(
    { id, albedo: pixels.albedo, normal: pixels.normal, roughness: pixels.roughness },
    [pixels.albedo.buffer, pixels.normal.buffer, pixels.roughness.buffer],
  );
};
