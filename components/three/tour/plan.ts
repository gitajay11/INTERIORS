/**
 * Floor plan and camera route for the home page walkthrough.
 *
 * Plain data (no three.js imports), so the DOM overlay, the 3D scene and unit
 * tests can all read it. Units are metres; +X is east, +Z is south, and the
 * origin is the centre of the living room floor.
 *
 *                      N
 *   ┌─────────┬─────────┬─────────┬─────────┐
 *   │ living  │ kitchen │ bedroom │  study  │
 *   └──┬───┬──┴─────────┴─────────┴─────────┘
 *      │foy│
 *      └─▲─┘   ← the walk starts outside, facing the front door
 */
import { ROOM, makeConfig, type DesignConfig, type FloorId, type LayoutId } from "../catalog";

export type Side = "north" | "south" | "east" | "west";

export interface Opening {
  /** Start and end along the wall, in room-local coordinates (x for N/S walls, z for E/W). */
  from: number;
  to: number;
  /** Head height of the opening. */
  top: number;
  /** Sill height; omitted for doors and passages. */
  bottom?: number;
  /** Glazed: gets a frame, sheers and a daylight glow. */
  window?: boolean;
}

export interface RoomSpec {
  id: string;
  /** Centre of the floor in world coordinates [x, z]. */
  center: [number, number];
  /** Interior size [width (x), depth (z)]. */
  size: [number, number];
  wall: string;
  floor: FloorId;
  /** Furniture arrangement; rooms without one are furnished by hand (the foyer). */
  layout?: LayoutId;
  config: DesignConfig;
  openings: Partial<Record<Side, Opening[]>>;
  /** Walls that face outdoors and take the facade finish on their outer face. */
  exterior: Side[];
}

/** Thickness of one wall skin. Neighbouring rooms each bring their own, back to back. */
export const WALL = 0.08;
export const CEILING = ROOM.height;
const PITCH = ROOM.width + WALL * 2; // centre-to-centre distance of rooms in the row
const HALF_D = ROOM.depth / 2;

const DOOR_TOP = 2.25;
const WINDOW = { bottom: 0.5, top: 2.45 };
const southWindow: Opening = { from: -2.5, to: 2.5, ...WINDOW, window: true };

// Doors between neighbouring rooms, as z-ranges on the shared wall.
const LIVING_KITCHEN: Opening = { from: 0.5, to: 1.7, top: DOOR_TOP };
const KITCHEN_BEDROOM: Opening = { from: -1.85, to: -0.65, top: DOOR_TOP };
const BEDROOM_STUDY: Opening = { from: -0.45, to: 0.65, top: DOOR_TOP };
const FOYER_LIVING: Opening = { from: -1.1, to: 1.1, top: 2.45 };

export const FOYER = { width: 3.2, depth: 3 } as const;
const FOYER_Z = HALF_D + WALL * 2 + FOYER.depth / 2;
/** World z of the outer face of the front door wall. */
export const FRONT_Z = FOYER_Z + FOYER.depth / 2 + WALL;
export const FRONT_DOOR: Opening = { from: -0.55, to: 0.55, top: 2.2 };

export const ROOMS: RoomSpec[] = [
  {
    id: "foyer",
    center: [0, FOYER_Z],
    size: [FOYER.width, FOYER.depth],
    wall: "#efe9dd",
    floor: "marble",
    config: makeConfig(),
    openings: { north: [FOYER_LIVING], south: [FRONT_DOOR] },
    exterior: ["south", "east", "west"],
  },
  {
    id: "living",
    center: [0, 0],
    size: [ROOM.width, ROOM.depth],
    wall: "#efe9dd",
    floor: "oak",
    layout: "living",
    config: makeConfig(),
    openings: {
      south: [FOYER_LIVING],
      east: [LIVING_KITCHEN],
      west: [{ from: -1.5, to: 1.1, ...WINDOW, window: true }],
    },
    exterior: ["west", "south", "north"],
  },
  {
    id: "kitchen",
    center: [PITCH, 0],
    size: [ROOM.width, ROOM.depth],
    wall: "#d9c9b0",
    floor: "tiles",
    layout: "dining",
    config: makeConfig({
      wall: "#d9c9b0",
      floor: "tiles",
      fabric: "#a8663f",
      variants: { table: "slab" },
    }),
    openings: { west: [LIVING_KITCHEN], east: [KITCHEN_BEDROOM], south: [southWindow] },
    exterior: ["south", "north"],
  },
  {
    id: "bedroom",
    center: [PITCH * 2, 0],
    size: [ROOM.width, ROOM.depth],
    wall: "#a9b19a",
    floor: "walnut",
    layout: "bedroom",
    // The floor lamp would stand in the doorway to the study.
    config: makeConfig({
      wall: "#a9b19a",
      floor: "walnut",
      fabric: "#d8cfbf",
      variants: { chairs: "frame", decor: "minimal" },
      hidden: ["lamps"],
    }),
    openings: { west: [KITCHEN_BEDROOM], east: [BEDROOM_STUDY], south: [southWindow] },
    exterior: ["south", "north"],
  },
  {
    id: "study",
    center: [PITCH * 3, 0],
    size: [ROOM.width, ROOM.depth],
    wall: "#6f7355",
    floor: "herringbone",
    layout: "office",
    config: makeConfig({
      wall: "#6f7355",
      floor: "herringbone",
      fabric: "#a79f92",
      variants: { lamps: "tripod", decor: "minimal" },
    }),
    openings: { west: [BEDROOM_STUDY], south: [southWindow] },
    exterior: ["south", "north", "east"],
  },
];

/** Bounding box of the row of rooms, for the roof, the slab and the shadow camera. */
export const HOUSE = {
  minX: -ROOM.width / 2 - WALL,
  maxX: PITCH * 3 + ROOM.width / 2 + WALL,
  minZ: -HALF_D - WALL,
  maxZ: HALF_D + WALL,
} as const;

// ---------------------------------------------------------------------------
// Camera route
// ---------------------------------------------------------------------------
type Vec3 = [number, number, number];

export interface Keyframe {
  position: Vec3;
  look: Vec3;
}

const EYE = 1.55;
const K = PITCH; // kitchen centre x
const B = PITCH * 2; // bedroom centre x
const S = PITCH * 3; // study centre x

/**
 * The walk, as camera positions and the point being looked at. A smooth curve
 * is fitted through both. Every position is checked against the furniture
 * layouts, so the camera never clips through a piece.
 */
export const KEYFRAMES: Keyframe[] = [
  // 0 — arrival: the house from the garden path
  { position: [0.7, 1.72, FRONT_Z + 8.2], look: [0, 1.5, FRONT_Z] },
  { position: [0.25, 1.62, FRONT_Z + 4], look: [0, 1.45, 3.5] },
  { position: [0, 1.58, FRONT_Z + 0.9], look: [0, 1.42, 0] },
  // 3 — foyer
  { position: [0.25, EYE, FOYER_Z + 0.5], look: [-1.2, 1.15, 3] }, // glancing left at the console
  { position: [0, EYE, HALF_D + 0.2], look: [0, 1.2, -2.2] },
  // 5 — living room
  { position: [0.3, EYE, 2.25], look: [-0.3, 1.15, -2] },
  { position: [1.7, EYE, 1.45], look: [4.6, 1.3, 0.7] },
  { position: [K - PITCH / 2, EYE, 1.1], look: [K + 0.4, 1.25, -0.8] },
  // 8 — kitchen and dining
  { position: [K - 2.9, EYE, 0.55], look: [K + 0.6, 1.1, -1.4] },
  { position: [K - 0.6, EYE, -1.2], look: [K + 1.4, 1.05, -2.6] },
  { position: [K + 2.05, EYE, -1.25], look: [K + 5.4, 1.3, -0.9] },
  { position: [K + PITCH / 2, EYE, -1.25], look: [B - 0.5, 1.2, -1.2] },
  // 12 — bedroom
  { position: [B - 2.1, EYE, -0.4], look: [B + 0.3, 1, -1.6] },
  { position: [B - 1.2, EYE, 2.2], look: [B + 0.1, 1, -1.8] },
  { position: [B + 1.3, EYE, 0.95], look: [B + 4.2, 1.3, 0.2] },
  { position: [B + PITCH / 2, EYE, 0.1], look: [S, 1.2, -0.8] },
  // 16 — study
  { position: [S - 2, EYE, 1.7], look: [S + 0.3, 1.15, -2] },
];

export interface TourStop {
  id: string;
  label: string;
  title: string;
  text: string;
  /** Index into KEYFRAMES where the camera rests for this stop. */
  keyframe: number;
  /** Where in the scroll range (0–1) the stop sits. */
  at: number;
}

export const STOPS: TourStop[] = [
  {
    id: "arrival",
    label: "Arrival",
    title: "Spaces Designed Around You.",
    text: "Scroll to step inside and walk through a home we designed.",
    keyframe: 0,
    at: 0,
  },
  {
    id: "foyer",
    label: "Entrance",
    title: "A calm arrival",
    text: "Honed marble underfoot, a fluted console for keys and post, and a first glimpse of the room beyond.",
    keyframe: 3,
    at: 0.22,
  },
  {
    id: "living",
    label: "Living room",
    title: "Where the day settles",
    text: "Wide-plank oak, a deep bouclé sofa and afternoon sun from the west window.",
    keyframe: 5,
    at: 0.38,
  },
  {
    id: "kitchen",
    label: "Kitchen & dining",
    title: "Made for long dinners",
    text: "A full-width kitchen run, a solid oak table for six and brass pendants hung low.",
    keyframe: 8,
    at: 0.57,
  },
  {
    id: "bedroom",
    label: "Bedroom",
    title: "Quiet by design",
    text: "Sage walls, walnut boards and soft linen: nothing in the room asks for attention.",
    keyframe: 13,
    at: 0.8,
  },
  {
    id: "study",
    label: "Study",
    title: "A room to think in",
    text: "Deep olive walls, a full wall of oak shelving and a desk that faces the room.",
    keyframe: 16,
    at: 1,
  },
];

// ---------------------------------------------------------------------------
// Looking around
// ---------------------------------------------------------------------------
/**
 * Where the visitor has turned to look, relative to the direction the route
 * faces at that point. Written by the page (drag, swipe, arrow keys) and read
 * by the camera every frame.
 */
export interface LookState {
  /** Radians turned to the left of the route's direction; unbounded, so a full turn is possible. */
  yaw: number;
  /** Radians looked up (positive) or down. */
  pitch: number;
  /** True while a drag is in progress; the camera then follows without lag. */
  dragging: boolean;
}

export const MAX_PITCH = 0.9;
/** Window event that asks the canvas to draw a frame (it renders on demand). */
export const TOUR_WAKE = "tour:wake";

/** Bring an angle into (−π, π], so easing back to the route takes the short way round. */
export function wrapAngle(angle: number): number {
  const turn = Math.PI * 2;
  return angle - turn * Math.round(angle / turn);
}

/**
 * Drops a User Timing mark, so start-up phases of the walkthrough show up in
 * the DevTools Performance panel (Timings track) and in `performance.getEntriesByType("mark")`.
 */
export function tourMark(name: string) {
  if (typeof performance !== "undefined" && typeof performance.mark === "function")
    performance.mark(`tour:${name}`);
}

/** How much of the way between two stops the camera eases, 0 (linear) – 1 (full ease). */
const EASE = 0.55;

/**
 * Scroll fraction (0–1) → position along the camera curve (0–1).
 * Between stops the motion eases in and out, so the walk lingers at each room.
 */
export function scrollToCurve(scroll: number): number {
  const p = Math.min(1, Math.max(0, scroll));
  const last = KEYFRAMES.length - 1;
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (p > b.at) continue;
    const t = (p - a.at) / (b.at - a.at);
    const eased = t * t * (3 - 2 * t);
    const k = t + (eased - t) * EASE;
    return (a.keyframe + (b.keyframe - a.keyframe) * k) / last;
  }
  return 1;
}

/**
 * The stop whose caption should show at this scroll fraction, or -1 while
 * walking between two rooms.
 */
export function activeStop(scroll: number): number {
  const reach = 0.36; // share of the gap to each neighbour that still belongs to a stop
  for (let i = 0; i < STOPS.length; i++) {
    const before = i === 0 ? 0 : (STOPS[i].at - STOPS[i - 1].at) * reach;
    const after = i === STOPS.length - 1 ? Infinity : (STOPS[i + 1].at - STOPS[i].at) * reach;
    if (scroll >= STOPS[i].at - before && scroll <= STOPS[i].at + after) return i;
  }
  return -1;
}
