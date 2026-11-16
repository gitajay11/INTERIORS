import * as THREE from "three";
import { generateSurfaceAsync } from "@/lib/surface-client";
import { generateSurface, type SurfacePixels, type SurfaceSpec } from "@/lib/surfaces";

export interface SurfaceTextures {
  map: THREE.DataTexture;
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
}

const cache = new Map<string, SurfaceTextures>();
const inflight = new Map<string, Promise<SurfaceTextures>>();
const keyOf = (spec: SurfaceSpec, size: number) => `${JSON.stringify(spec)}@${size}`;

function toTexture(data: Uint8ClampedArray<ArrayBuffer>, size: number, srgb: boolean) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function store(key: string, pixels: SurfacePixels): SurfaceTextures {
  const textures: SurfaceTextures = {
    map: toTexture(pixels.albedo, pixels.size, true),
    normalMap: toTexture(pixels.normal, pixels.size, false),
    roughnessMap: toTexture(pixels.roughness, pixels.size, false),
  };
  cache.set(key, textures);
  return textures;
}

/**
 * Albedo / normal / roughness textures for a surface spec. Results are cached per
 * spec + size, so swapping back to a floor that was already shown is instant.
 *
 * This runs on the calling thread (50–110 ms at 512 px). Scenes that need
 * several surfaces at once should use `loadSurfaceTextures` instead.
 */
export function getSurfaceTextures(spec: SurfaceSpec, size = 512): SurfaceTextures {
  const key = keyOf(spec, size);
  return cache.get(key) ?? store(key, generateSurface(spec, size));
}

/** The textures for a spec if they have already been generated, without generating them. */
export function peekSurfaceTextures(spec: SurfaceSpec, size = 512): SurfaceTextures | null {
  return cache.get(keyOf(spec, size)) ?? null;
}

/**
 * Like `getSurfaceTextures`, but the pixels are generated in a Web Worker, so
 * the page stays responsive. Concurrent requests for the same surface share one job.
 */
export function loadSurfaceTextures(spec: SurfaceSpec, size = 512): Promise<SurfaceTextures> {
  const key = keyOf(spec, size);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const running = inflight.get(key);
  if (running) return running;

  const promise = generateSurfaceAsync(spec, size)
    .then((pixels) => cache.get(key) ?? store(key, pixels))
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** How many surfaces are still being generated. Scenes wait for zero before revealing themselves. */
export function pendingSurfaceLoads(): number {
  return inflight.size;
}
