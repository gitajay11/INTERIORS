/**
 * Shareable-URL codec for a 3D Studio design.
 *
 * A design is encoded as short, human-readable query params, e.g.
 *   ?wall=d9c9b0&floor=walnut&fabric=6b7257&sofa=curve&table=slab&hide=rug,lamps&empty=1
 * Only values that differ from the default are written, so links stay short.
 */
import {
  DEFAULT_CONFIG,
  FLOOR_IDS,
  FURNITURE,
  SLOT_IDS,
  cloneConfig,
  isHexColor,
  type DesignConfig,
  type FloorId,
  type SlotId,
} from "@/components/three/catalog";

/**
 * @param full Always write wall and floor, even when they match the default. Use
 *   this for links that must replace whatever design the visitor has saved.
 */
export function encodeConfig(config: DesignConfig, full = false): string {
  const params = new URLSearchParams();
  if (full || config.wall.toLowerCase() !== DEFAULT_CONFIG.wall) {
    params.set("wall", config.wall.replace("#", "").toLowerCase());
  }
  if (full || config.floor !== DEFAULT_CONFIG.floor) params.set("floor", config.floor);
  if (config.fabric.toLowerCase() !== DEFAULT_CONFIG.fabric) {
    params.set("fabric", config.fabric.replace("#", "").toLowerCase());
  }
  const hidden: SlotId[] = [];
  for (const slot of SLOT_IDS) {
    const state = config.furniture[slot];
    if (state.variant !== DEFAULT_CONFIG.furniture[slot].variant) params.set(slot, state.variant);
    if (!state.visible) hidden.push(slot);
  }
  if (hidden.length) params.set("hide", hidden.join(","));
  if (config.empty) params.set("empty", "1");
  return params.toString();
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function read(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Decode query params into a full, validated config. Unknown or malformed values
 * are ignored, so a tampered link can never put the scene into an invalid state.
 * Returns `null` when the params contain no design information at all.
 */
export function decodeConfig(source: ParamSource): DesignConfig | null {
  const config = cloneConfig(DEFAULT_CONFIG);
  let touched = false;

  const wall = read(source, "wall");
  if (wall && isHexColor(`#${wall}`)) {
    config.wall = `#${wall.toLowerCase()}`;
    touched = true;
  }
  const floor = read(source, "floor");
  if (floor && (FLOOR_IDS as readonly string[]).includes(floor)) {
    config.floor = floor as FloorId;
    touched = true;
  }
  const fabric = read(source, "fabric");
  if (fabric && isHexColor(`#${fabric}`)) {
    config.fabric = `#${fabric.toLowerCase()}`;
    touched = true;
  }
  for (const slot of SLOT_IDS) {
    const variant = read(source, slot);
    if (variant && FURNITURE[slot].variants.some((v) => v.id === variant)) {
      config.furniture[slot].variant = variant;
      touched = true;
    }
  }
  const hide = read(source, "hide");
  if (hide) {
    for (const slot of hide.split(",")) {
      if ((SLOT_IDS as readonly string[]).includes(slot)) {
        config.furniture[slot as SlotId].visible = false;
        touched = true;
      }
    }
  }
  if (read(source, "empty") === "1") {
    config.empty = true;
    touched = true;
  }
  return touched ? config : null;
}

/** One-line, human-readable description used in booking emails and summaries. */
export function describeConfig(config: DesignConfig): string {
  const pieces = SLOT_IDS.filter((slot) => config.furniture[slot].visible && !config.empty).map(
    (slot) => {
      const variant = FURNITURE[slot].variants.find((v) => v.id === config.furniture[slot].variant);
      return `${FURNITURE[slot].label}: ${variant?.name ?? config.furniture[slot].variant}`;
    },
  );
  return [
    `Walls ${config.wall}`,
    `Floor ${config.floor}`,
    `Upholstery ${config.fabric}`,
    pieces.length ? pieces.join(", ") : "Empty room",
  ].join(" · ");
}
