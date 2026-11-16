/**
 * Catalog for the 3D room: paint swatches, floors, furniture slots/variants,
 * camera presets and room layouts.
 *
 * This file is plain data (no three.js imports) so the Zustand store, the URL
 * codec, server components and unit tests can all use it.
 */
import type { SurfaceSpec } from "@/lib/surfaces";

// ---- Room dimensions (metres). Origin is the centre of the floor. ----------
export const ROOM = { width: 7, depth: 5.5, height: 2.9 } as const;

// ---- Walls ------------------------------------------------------------------
export interface WallSwatch {
  name: string;
  hex: string;
}

export const WALL_SWATCHES: WallSwatch[] = [
  { name: "Ivory Linen", hex: "#efe9dd" },
  { name: "Warm Sand", hex: "#d9c9b0" },
  { name: "Soft Taupe", hex: "#b5a696" },
  { name: "Sage Leaf", hex: "#a9b19a" },
  { name: "Terracotta Clay", hex: "#c49a7c" },
  { name: "Mist Blue", hex: "#b8c4c9" },
  { name: "Deep Olive", hex: "#6f7355" },
  { name: "Charcoal", hex: "#4a4743" },
];

// ---- Floors -----------------------------------------------------------------
export const FLOOR_IDS = ["oak", "walnut", "herringbone", "marble", "concrete", "tiles"] as const;
export type FloorId = (typeof FLOOR_IDS)[number];

export interface FloorOption {
  id: FloorId;
  name: string;
  description: string;
  /** Procedural PBR definition (albedo + normal + roughness are generated from it). */
  surface: SurfaceSpec;
  /** How many times the texture repeats across the floor [x, z]. */
  repeat: [number, number];
}

export const FLOORS: Record<FloorId, FloorOption> = {
  oak: {
    id: "oak",
    name: "Natural Oak",
    description: "Wide-plank European oak, matte oil finish",
    surface: { pattern: "planks", base: "#c8a67a", accent: "#a98356", rows: 8, roughness: 0.62 },
    repeat: [4, 4],
  },
  walnut: {
    id: "walnut",
    name: "American Walnut",
    description: "Rich walnut boards with a satin lacquer",
    surface: { pattern: "planks", base: "#6f4c33", accent: "#4d3222", rows: 8, roughness: 0.5 },
    repeat: [4, 4],
  },
  herringbone: {
    id: "herringbone",
    name: "Oak Herringbone",
    description: "Classic herringbone parquet in smoked oak",
    surface: {
      pattern: "herringbone",
      base: "#b58e62",
      accent: "#8e6b45",
      rows: 6,
      roughness: 0.55,
    },
    repeat: [4, 4],
  },
  marble: {
    id: "marble",
    name: "Calacatta Marble",
    description: "Honed white marble with warm grey veining",
    surface: { pattern: "marble", base: "#ece8e1", accent: "#8f8a82", roughness: 0.22 },
    repeat: [2, 2],
  },
  concrete: {
    id: "concrete",
    name: "Polished Concrete",
    description: "Seamless micro-topping in warm grey",
    surface: { pattern: "concrete", base: "#a9a59d", accent: "#8d8982", roughness: 0.5 },
    repeat: [2, 2],
  },
  tiles: {
    id: "tiles",
    name: "Limestone Tiles",
    description: "Large-format limestone with fine grout lines",
    surface: { pattern: "tiles", base: "#d6cdbd", accent: "#b4a996", rows: 3, roughness: 0.45 },
    repeat: [3, 3],
  },
};

// ---- Upholstery -------------------------------------------------------------
export const FABRIC_SWATCHES: WallSwatch[] = [
  { name: "Oat Bouclé", hex: "#d8cfbf" },
  { name: "Stone Linen", hex: "#a79f92" },
  { name: "Moss Velvet", hex: "#6b7257" },
  { name: "Rust Wool", hex: "#a8663f" },
  { name: "Ink Twill", hex: "#3d4350" },
];

// ---- Furniture --------------------------------------------------------------
export const SLOT_IDS = ["sofa", "table", "chairs", "rug", "lamps", "shelves", "decor"] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface FurnitureVariant {
  id: string;
  name: string;
  description: string;
}

export interface FurnitureSlot {
  id: SlotId;
  label: string;
  variants: FurnitureVariant[];
}

export const FURNITURE: Record<SlotId, FurnitureSlot> = {
  sofa: {
    id: "sofa",
    label: "Sofa",
    variants: [
      { id: "lounge", name: "Lounge", description: "Deep three-seater with loose cushions" },
      { id: "curve", name: "Curve", description: "Sculpted, rounded silhouette" },
      { id: "sectional", name: "Sectional", description: "L-shaped corner with chaise" },
    ],
  },
  table: {
    id: "table",
    label: "Coffee table",
    variants: [
      { id: "round", name: "Stone Round", description: "Travertine drum table" },
      { id: "slab", name: "Oak Slab", description: "Low rectangular solid oak" },
      { id: "nest", name: "Nesting Pair", description: "Two brass-framed nesting tables" },
    ],
  },
  chairs: {
    id: "chairs",
    label: "Armchairs",
    variants: [
      { id: "club", name: "Club", description: "Upholstered barrel chairs" },
      { id: "frame", name: "Frame", description: "Timber frame with sling seat" },
    ],
  },
  rug: {
    id: "rug",
    label: "Rug",
    variants: [
      { id: "wool", name: "Wool Border", description: "Hand-loomed rectangular wool" },
      { id: "jute", name: "Round Jute", description: "Braided natural jute circle" },
    ],
  },
  lamps: {
    id: "lamps",
    label: "Lamps",
    variants: [
      { id: "arc", name: "Arc", description: "Brass arc floor lamp" },
      { id: "tripod", name: "Tripod", description: "Timber tripod with linen shade" },
    ],
  },
  shelves: {
    id: "shelves",
    label: "Shelving",
    variants: [
      { id: "open", name: "Open Shelf", description: "Tall open oak bookcase" },
      { id: "credenza", name: "Credenza", description: "Low fluted sideboard" },
    ],
  },
  decor: {
    id: "decor",
    label: "Art & plants",
    variants: [
      { id: "gallery", name: "Gallery", description: "Framed art and a fiddle-leaf fig" },
      { id: "minimal", name: "Minimal", description: "Single large canvas and an olive tree" },
    ],
  },
};

// ---- Layouts (used by project pages; the configurator uses "living") --------
export const LAYOUT_IDS = ["living", "bedroom", "dining", "office"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

// ---- Design configuration ---------------------------------------------------
export interface SlotState {
  variant: string;
  visible: boolean;
}

export interface DesignConfig {
  wall: string;
  floor: FloorId;
  fabric: string;
  furniture: Record<SlotId, SlotState>;
  /** "Show empty room": hides everything regardless of per-item visibility. */
  empty: boolean;
}

export const DEFAULT_CONFIG: DesignConfig = {
  wall: WALL_SWATCHES[0].hex,
  floor: "oak",
  fabric: FABRIC_SWATCHES[0].hex,
  furniture: {
    sofa: { variant: "lounge", visible: true },
    table: { variant: "round", visible: true },
    chairs: { variant: "club", visible: true },
    rug: { variant: "wool", visible: true },
    lamps: { variant: "arc", visible: true },
    shelves: { variant: "open", visible: true },
    decor: { variant: "gallery", visible: true },
  },
  empty: false,
};

/** Deep-ish clone so store resets never share object references with the default. */
export function cloneConfig(config: DesignConfig): DesignConfig {
  return {
    ...config,
    furniture: Object.fromEntries(
      SLOT_IDS.map((slot) => [slot, { ...config.furniture[slot] }]),
    ) as Record<SlotId, SlotState>,
  };
}

/** Build a full config from a partial description (used by seed projects and mood boards). */
export function makeConfig(
  partial: Partial<Pick<DesignConfig, "wall" | "floor" | "fabric" | "empty">> & {
    variants?: Partial<Record<SlotId, string>>;
    hidden?: SlotId[];
  } = {},
): DesignConfig {
  const config = cloneConfig(DEFAULT_CONFIG);
  if (partial.wall) config.wall = partial.wall;
  if (partial.floor) config.floor = partial.floor;
  if (partial.fabric) config.fabric = partial.fabric;
  if (partial.empty) config.empty = true;
  for (const slot of SLOT_IDS) {
    const variant = partial.variants?.[slot];
    if (variant && FURNITURE[slot].variants.some((v) => v.id === variant)) {
      config.furniture[slot].variant = variant;
    }
    if (partial.hidden?.includes(slot)) config.furniture[slot].visible = false;
  }
  return config;
}

// ---- Camera -----------------------------------------------------------------
export const PRESET_IDS = ["front", "top", "corner", "closeup"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export interface CameraPreset {
  id: PresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<PresetId, CameraPreset> = {
  front: { id: "front", label: "Front", position: [0, 1.7, 7.4], target: [0, 1.0, -0.6] },
  top: { id: "top", label: "Top", position: [0, 10.5, 0.02], target: [0, 0, 0] },
  corner: { id: "corner", label: "Corner", position: [6.2, 3.4, 6.0], target: [0, 0.8, -0.5] },
  closeup: {
    id: "closeup",
    label: "Close-up",
    position: [1.9, 1.15, 1.9],
    target: [0, 0.55, -1.2],
  },
};

export const DEFAULT_PRESET: PresetId = "corner";

/** Orbit limits shared by every viewer instance. */
export const CAMERA_LIMITS = {
  minDistance: 2.2,
  maxDistance: 13,
  /** The orbit target may not leave this box, so users cannot pan away from the room. */
  targetBounds: {
    min: [-ROOM.width / 2, 0, -ROOM.depth / 2] as [number, number, number],
    max: [ROOM.width / 2, ROOM.height, ROOM.depth / 2] as [number, number, number],
  },
} as const;

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);
