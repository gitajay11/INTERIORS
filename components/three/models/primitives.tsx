"use client";

/**
 * Small building blocks shared by every procedural furniture piece.
 * Everything is authored in metres with +Y up; pieces sit on y = 0 and face +Z.
 */
import type { ReactNode } from "react";
import { BoxGeometry, type BufferGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Vec3 = [number, number, number];

// ---- Materials --------------------------------------------------------------
// Each call creates its own material instance on purpose: <FadeSwap> fades a
// piece by animating the opacity of the materials underneath it.
export const Fabric = ({ color }: { color: string }) => (
  <meshStandardMaterial color={color} roughness={0.96} metalness={0} />
);
export const Wood = ({ color = "#b08a5e" }: { color?: string }) => (
  <meshStandardMaterial color={color} roughness={0.58} metalness={0} />
);
export const Brass = () => <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />;
export const Stone = ({ color = "#d3c8b5" }: { color?: string }) => (
  <meshStandardMaterial color={color} roughness={0.5} metalness={0} />
);
export const Matte = ({ color, roughness = 0.8 }: { color: string; roughness?: number }) => (
  <meshStandardMaterial color={color} roughness={roughness} metalness={0} />
);
/** Lamp shades and bulbs: emissive so they bloom slightly. */
export const Glow = ({
  color = "#ffe2b0",
  intensity = 1.6,
}: {
  color?: string;
  intensity?: number;
}) => (
  <meshStandardMaterial
    color={color}
    emissive={color}
    emissiveIntensity={intensity}
    roughness={0.9}
  />
);

// ---- Shapes -----------------------------------------------------------------
interface BoxProps {
  /** Size [w, h, d]. */
  s: Vec3;
  /** Centre position. */
  p?: Vec3;
  /** Rotation in radians. */
  rot?: Vec3;
  /** Corner radius; clamped so thin boards stay valid. */
  r?: number;
  children: ReactNode;
}

/**
 * Geometry for a soft-edged box, shared between every box of the same size.
 *
 * A furnished house is well over a thousand boxes (books alone are hundreds).
 * Building an extruded, crease-normalled geometry for each one took seconds of
 * main-thread time before the first frame; this version is a subdivided box
 * with its corners pulled in, costs a fraction of a millisecond and is cached.
 * Edges too fine to see (book covers, drawer fronts) skip the rounding entirely.
 */
const boxGeometries = new Map<string, BufferGeometry>();
const MIN_VISIBLE_RADIUS = 0.006;

function boxGeometry(size: Vec3, radius: number): BufferGeometry {
  const rounded = radius >= MIN_VISIBLE_RADIUS;
  const key = `${size[0].toFixed(4)}|${size[1].toFixed(4)}|${size[2].toFixed(4)}|${rounded ? radius.toFixed(4) : "sharp"}`;
  let geometry = boxGeometries.get(key);
  if (!geometry) {
    geometry = rounded
      ? new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius)
      : new BoxGeometry(size[0], size[1], size[2]);
    boxGeometries.set(key, geometry);
  }
  return geometry;
}

/** Soft-edged box that casts and receives shadows. */
export function Box({ s, p = [0, 0, 0], rot, r = 0.02, children }: BoxProps) {
  const radius = Math.max(0, Math.min(r, Math.min(...s) / 2 - 0.001));
  return (
    // The geometry is passed as a prop (not declared as a child), so React Three
    // Fiber leaves the shared instance alone when a piece unmounts.
    <mesh geometry={boxGeometry(s, radius)} position={p} rotation={rot} castShadow receiveShadow>
      {children}
    </mesh>
  );
}

interface CylProps {
  /** Radius (or [top, bottom]). */
  r: number | [number, number];
  h: number;
  p?: Vec3;
  rot?: Vec3;
  segments?: number;
  open?: boolean;
  children: ReactNode;
}

export function Cyl({ r, h, p = [0, 0, 0], rot, segments = 40, open = false, children }: CylProps) {
  const [top, bottom] = Array.isArray(r) ? r : [r, r];
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[top, bottom, h, segments, 1, open]} />
      {children}
    </mesh>
  );
}

export function Ball({
  r,
  p = [0, 0, 0],
  scale,
  children,
}: {
  r: number;
  p?: Vec3;
  scale?: Vec3;
  children: ReactNode;
}) {
  return (
    <mesh position={p} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[r, 24, 18]} />
      {children}
    </mesh>
  );
}

/** Deterministic pseudo-random number in [0, 1) so scenes render identically every time. */
export function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
