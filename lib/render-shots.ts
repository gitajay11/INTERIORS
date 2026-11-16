/**
 * Camera positions for the still images rendered from each project's 3D scene
 * by `pnpm render:images`. Shared by the /render route and the script.
 */
import type { LayoutId } from "@/components/three/catalog";

export interface Shot {
  position: [number, number, number];
  target: [number, number, number];
  /** Render the bare shell (white walls, concrete floor, no furniture). */
  bare?: boolean;
}

const HERO: Shot = { position: [5.6, 2.6, 5.6], target: [0, 0.9, -0.6] };

const DETAIL: Record<LayoutId, Shot> = {
  living: { position: [2.0, 1.2, 2.0], target: [0, 0.55, -1.2] },
  bedroom: { position: [2.3, 1.3, 1.9], target: [0, 0.6, -1.3] },
  dining: { position: [2.5, 1.5, 2.9], target: [0, 0.9, 0.2] },
  office: { position: [2.2, 1.5, 1.6], target: [0, 0.9, -1.4] },
};

export const SHOT_NAMES = ["cover", "wide", "detail", "side", "plan", "before", "after"] as const;
export type ShotName = (typeof SHOT_NAMES)[number];

export function getShot(name: ShotName, layout: LayoutId): Shot {
  switch (name) {
    case "wide":
      return { position: [0, 1.65, 7.6], target: [0, 1.0, -0.6] };
    case "detail":
      return DETAIL[layout];
    case "side":
      return { position: [-2.6, 1.7, 6.4], target: [1.0, 0.9, -0.6] };
    case "plan":
      return { position: [0, 10.2, 0.02], target: [0, 0, 0] };
    case "before":
      return { ...HERO, bare: true };
    default:
      return HERO;
  }
}

/** Matches the starting pose of the home page hero camera. */
export const HERO_SHOT: Shot = { position: [3.55, 2.15, 5.79], target: [0, 1.05, -0.7] };
