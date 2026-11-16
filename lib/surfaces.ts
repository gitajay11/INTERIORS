/**
 * Procedural PBR surfaces.
 *
 * Instead of shipping texture files, every floor and material swatch is described
 * by a small `SurfaceSpec` and turned into a tileable albedo / normal / roughness
 * set at runtime. The generator is pure (typed arrays in, typed arrays out), so it
 * runs in the browser, in workers and in unit tests.
 *
 * To use real scanned textures instead, see README → "Adding 3D models & materials".
 */

export type SurfacePattern =
  | "planks"
  | "herringbone"
  | "marble"
  | "concrete"
  | "tiles"
  | "paint"
  | "fabric"
  | "stone"
  | "terrazzo";

export interface SurfaceSpec {
  pattern: SurfacePattern;
  /** Main colour (hex). */
  base: string;
  /** Secondary colour: grain, veins, grout, chips (hex). */
  accent: string;
  /** Boards / tiles per texture tile, where the pattern has such a notion. */
  rows?: number;
  /** Average roughness, 0 (mirror) – 1 (chalk). */
  roughness?: number;
  metalness?: number;
}

export interface SurfacePixels {
  size: number;
  /** RGBA, sRGB encoded. */
  albedo: Uint8ClampedArray<ArrayBuffer>;
  /** RGBA tangent-space normal map. */
  normal: Uint8ClampedArray<ArrayBuffer>;
  /** RGBA, roughness in every channel (three.js reads green). */
  roughness: Uint8ClampedArray<ArrayBuffer>;
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// ---- Tileable value noise ---------------------------------------------------
function hash(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Value noise that repeats every `px` × `py` lattice cells. */
function noise(x: number, y: number, px: number, py: number, seed = 0): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const x0 = mod(ix, px);
  const x1 = mod(ix + 1, px);
  const y0 = mod(iy, py);
  const y1 = mod(iy + 1, py);
  const a = hash(x0, y0, seed);
  const b = hash(x1, y0, seed);
  const c = hash(x0, y1, seed);
  const d = hash(x1, y1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal noise over the unit square, tileable. `fx`/`fy` are base frequencies. */
function fbm(u: number, v: number, fx: number, fy: number, octaves = 4, seed = 0): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const m = 1 << i;
    sum += amp * noise(u * fx * m, v * fy * m, fx * m, fy * m, seed + i * 17);
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

interface Sample {
  /** 0 = base colour, 1 = accent colour. */
  t: number;
  /** Brightness multiplier. */
  tint: number;
  /** Height, 0–1, used to derive the normal map. */
  h: number;
  /** Roughness multiplier. */
  r: number;
}

type Sampler = (u: number, v: number, rows: number) => Sample;

/** Soft edge mask: 0 on a joint, 1 inside the board/tile. */
const joint = (f: number, width: number) => clamp01(Math.min(f, 1 - f) / width);

const SAMPLERS: Record<SurfacePattern, Sampler> = {
  planks(u, v, rows) {
    const row = Math.floor(v * rows);
    const boards = 2; // boards per tile along the length
    const offset = hash(row, 7, 3);
    const along = u * boards + offset;
    const board = mod(Math.floor(along), boards);
    const tone = hash(row, board, 11);
    const grain = fbm(u, v, 6, rows * 14, 4, row * 5 + board);
    const edge = Math.min(joint(v * rows - row, 0.035), joint(along - Math.floor(along), 0.006));
    return {
      t: clamp01(0.12 + tone * 0.26 + grain * 0.42),
      tint: 0.62 + 0.38 * edge,
      h: edge * (0.9 + grain * 0.1),
      r: 0.92 + grain * 0.16,
    };
  },
  herringbone(u, v, rows) {
    const cols = rows % 2 === 0 ? rows : rows + 1;
    const col = Math.floor(u * cols);
    const local = u * cols - col;
    const dir = col % 2 === 0 ? 1 : -1;
    const stripes = cols * 3;
    const s = v * stripes + dir * local * 3 + (dir < 0 ? 3 : 0);
    const stripe = mod(Math.floor(s), stripes);
    const tone = hash(col, stripe, 23);
    const grain = fbm(u + v * dir, v, 24, 24, 3, col * 3 + stripe);
    const edge = Math.min(joint(s - Math.floor(s), 0.05), joint(local, 0.015));
    return {
      t: clamp01(0.1 + tone * 0.45 + grain * 0.45),
      tint: 0.55 + 0.45 * edge,
      h: edge,
      r: 0.92 + grain * 0.16,
    };
  },
  marble(u, v) {
    const cloud = fbm(u, v, 3, 3, 5, 2);
    const warp = fbm(u, v, 2, 2, 4, 9);
    const vein = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * 2 + v + warp * 3.2))), 14);
    const fine = Math.pow(1 - Math.abs(Math.sin(Math.PI * (u * 3 - v * 2 + cloud * 5))), 26);
    return {
      t: clamp01(vein * 0.85 + fine * 0.45 + (cloud - 0.5) * 0.25),
      tint: 0.96 + cloud * 0.06,
      h: 1 - vein * 0.04,
      r: 0.9 + cloud * 0.2,
    };
  },
  concrete(u, v) {
    const cloud = fbm(u, v, 3, 3, 5, 4);
    const speck = noise(u * 96, v * 96, 96, 96, 8);
    return {
      t: clamp01(cloud * 0.9 + (speck - 0.5) * 0.25),
      tint: 0.94 + speck * 0.08,
      h: 0.8 + cloud * 0.12 + speck * 0.08,
      r: 0.85 + cloud * 0.3,
    };
  },
  tiles(u, v, rows) {
    const cx = Math.floor(u * rows);
    const cy = Math.floor(v * rows);
    const edge = Math.min(joint(u * rows - cx, 0.012), joint(v * rows - cy, 0.012));
    const tone = hash(cx, cy, 31);
    const cloud = fbm(u, v, rows * 2, rows * 2, 4, cx + cy * 7);
    return {
      t: edge < 1 ? 1 : clamp01(tone * 0.3 + cloud * 0.5),
      tint: 0.7 + 0.3 * edge,
      h: edge,
      r: edge < 1 ? 1.2 : 0.9 + cloud * 0.2,
    };
  },
  paint(u, v) {
    const peel = noise(u * 128, v * 128, 128, 128, 5);
    const cloud = fbm(u, v, 2, 2, 3, 6);
    return { t: cloud * 0.12, tint: 0.98 + peel * 0.03, h: 0.5 + peel * 0.06, r: 1 };
  },
  fabric(u, v, rows) {
    const n = rows * 8;
    const warp = Math.sin(u * n * Math.PI * 2);
    const weft = Math.sin(v * n * Math.PI * 2);
    const over = Math.floor(u * n) % 2 === Math.floor(v * n) % 2;
    const weave = over ? Math.abs(warp) : Math.abs(weft);
    const slub = fbm(u, v, 4, 48, 3, 12);
    return {
      t: clamp01(slub * 0.5 + (over ? 0.15 : 0)),
      tint: 0.82 + weave * 0.18,
      h: weave,
      r: 1,
    };
  },
  stone(u, v) {
    const bands = fbm(u, v, 2, 14, 5, 15);
    const pits = noise(u * 64, v * 110, 64, 110, 21);
    const pit = pits > 0.86 ? 1 : 0;
    return {
      t: clamp01(bands * 0.9 + pit * 0.3),
      tint: 1 - pit * 0.18,
      h: 1 - pit * 0.6,
      r: 0.9 + bands * 0.2,
    };
  },
  terrazzo(u, v) {
    const big = noise(u * 14, v * 14, 14, 14, 41);
    const small = noise(u * 34, v * 34, 34, 34, 43);
    const chip = big > 0.66 || small > 0.74 ? 1 : 0;
    const shade = hash(Math.floor(u * 14), Math.floor(v * 14), 47);
    return { t: chip * (0.55 + shade * 0.45), tint: 1, h: 1, r: 0.95 + chip * 0.1 };
  },
};

/** How strongly height differences bend the normal, per pattern. */
const NORMAL_STRENGTH: Record<SurfacePattern, number> = {
  planks: 2.2,
  herringbone: 2.2,
  marble: 0.6,
  concrete: 1.4,
  tiles: 2.4,
  paint: 0.8,
  fabric: 2.6,
  stone: 2.2,
  terrazzo: 0.3,
};

/** Generate a tileable albedo / normal / roughness set for a surface. */
export function generateSurface(spec: SurfaceSpec, size = 512): SurfacePixels {
  const sampler = SAMPLERS[spec.pattern];
  const rows = spec.rows ?? 4;
  const [br, bg, bb] = hexToRgb(spec.base);
  const [ar, ag, ab] = hexToRgb(spec.accent);
  const baseRoughness = spec.roughness ?? 0.7;

  const albedo = new Uint8ClampedArray(size * size * 4);
  const normal = new Uint8ClampedArray(size * size * 4);
  const roughness = new Uint8ClampedArray(size * size * 4);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = sampler((x + 0.5) / size, (y + 0.5) / size, rows);
      const i = y * size + x;
      const o = i * 4;
      albedo[o] = (br + (ar - br) * s.t) * s.tint;
      albedo[o + 1] = (bg + (ag - bg) * s.t) * s.tint;
      albedo[o + 2] = (bb + (ab - bb) * s.t) * s.tint;
      albedo[o + 3] = 255;
      const rough = clamp01(baseRoughness * s.r) * 255;
      roughness[o] = roughness[o + 1] = roughness[o + 2] = rough;
      roughness[o + 3] = 255;
      height[i] = s.h;
    }
  }

  // Central-difference normals, wrapping at the edges so the map tiles.
  const strength = NORMAL_STRENGTH[spec.pattern] * (size / 256);
  for (let y = 0; y < size; y++) {
    const up = mod(y - 1, size) * size;
    const down = mod(y + 1, size) * size;
    for (let x = 0; x < size; x++) {
      const left = mod(x - 1, size);
      const right = mod(x + 1, size);
      const dx = (height[y * size + right] - height[y * size + left]) * strength;
      const dy = (height[down + x] - height[up + x]) * strength;
      const len = Math.hypot(dx, dy, 1);
      const o = (y * size + x) * 4;
      normal[o] = (-dx / len) * 127.5 + 127.5;
      normal[o + 1] = (-dy / len) * 127.5 + 127.5;
      normal[o + 2] = (1 / len) * 127.5 + 127.5;
      normal[o + 3] = 255;
    }
  }

  return { size, albedo, normal, roughness };
}
