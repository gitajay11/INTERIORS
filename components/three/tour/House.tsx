"use client";

/**
 * The house the home page walks through: a foyer and four furnished rooms in a
 * row, with real walls, doorways, windows, ceilings and a roof, plus a little
 * of the garden in front. Everything is procedural, like the single-room scene.
 *
 * Rooms and the camera route are described in ./plan.ts.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FLOORS, ROOM } from "../catalog";
import { RoomFurniture } from "../RoomScene";
import { loadSurfaceTextures, peekSurfaceTextures, type SurfaceTextures } from "../textures";
import { Bench, Credenza, Pendant, Plant, Rug, WallArt } from "../models/furniture";
import {
  CEILING,
  FOYER,
  FRONT_DOOR,
  FRONT_Z,
  HOUSE,
  ROOMS,
  WALL,
  type Opening,
  type RoomSpec,
  type Side,
  tourMark,
} from "./plan";
import type { SurfaceSpec } from "@/lib/surfaces";

type Vec3 = [number, number, number];

const FACADE = "#ebe5d9";
const TRIM = "#3a342e";
const SIDES: Side[] = ["north", "south", "east", "west"];
/** Furniture further than this (in x) from the camera is not drawn. Chosen so no
 *  room can be seen through the doorways before its furniture is switched on. */
const CULL_DISTANCE = 16;

// ---------------------------------------------------------------------------
// Textures
// ---------------------------------------------------------------------------
/**
 * Private copies of a surface's textures, so each room can set its own tiling.
 * The pixels are generated in a Web Worker; until they arrive this returns
 * null and the floor is drawn in its flat base colour.
 */
function useTiledTextures(
  surface: SurfaceSpec,
  repeat: [number, number],
  size: number,
): SurfaceTextures | null {
  const [shared, setShared] = useState<SurfaceTextures | null>(() =>
    peekSurfaceTextures(surface, size),
  );
  useEffect(() => {
    let live = true;
    void loadSurfaceTextures(surface, size).then((textures) => {
      if (live) setShared(textures);
    });
    return () => {
      live = false;
    };
  }, [surface, size]);

  const [repeatX, repeatY] = repeat;
  const textures = useMemo(() => {
    if (!shared) return null;
    const copy = (texture: THREE.DataTexture) => {
      const clone = texture.clone();
      clone.repeat.set(repeatX, repeatY);
      clone.needsUpdate = true;
      return clone;
    };
    return {
      map: copy(shared.map),
      normalMap: copy(shared.normalMap),
      roughnessMap: copy(shared.roughnessMap),
    };
  }, [shared, repeatX, repeatY]);
  useEffect(
    () => () => {
      if (textures) for (const texture of Object.values(textures)) texture.dispose();
    },
    [textures],
  );
  return textures;
}

/** Textured surface material, or a flat stand-in while its textures are still being generated. */
function SurfaceMaterial({
  textures,
  color,
  normals = true,
}: {
  textures: SurfaceTextures | null;
  color: string;
  normals?: boolean;
}) {
  if (!textures) return <meshStandardMaterial key="flat" color={color} roughness={0.8} />;
  return (
    <meshStandardMaterial
      key="textured"
      map={textures.map}
      normalMap={normals ? textures.normalMap : null}
      roughnessMap={textures.roughnessMap}
      roughness={1}
      envMapIntensity={0.9}
    />
  );
}

// ---------------------------------------------------------------------------
// Walls
// ---------------------------------------------------------------------------
interface Slab {
  along: [number, number];
  y: [number, number];
}

/** Split a wall of the given length into solid boxes around its openings. */
export function wallSlabs(length: number, openings: Opening[] = []): Slab[] {
  const half = length / 2;
  const slabs: Slab[] = [];
  let cursor = -half;
  for (const opening of [...openings].sort((a, b) => a.from - b.from)) {
    if (opening.from > cursor) slabs.push({ along: [cursor, opening.from], y: [0, CEILING] });
    if (opening.top < CEILING)
      slabs.push({ along: [opening.from, opening.to], y: [opening.top, CEILING] });
    if (opening.bottom) slabs.push({ along: [opening.from, opening.to], y: [0, opening.bottom] });
    cursor = opening.to;
  }
  if (cursor < half) slabs.push({ along: [cursor, half], y: [0, CEILING] });
  return slabs;
}

/** Index of the box face that points away from the room, per wall side (+x −x +y −y +z −z). */
const OUTER_FACE: Record<Side, number> = { east: 0, west: 1, south: 4, north: 5 };

function Wall({
  side,
  spec,
  interior,
  facade,
}: {
  side: Side;
  spec: RoomSpec;
  interior: THREE.Material;
  facade: THREE.Material;
}) {
  const [w, d] = spec.size;
  const alongX = side === "north" || side === "south";
  // North and south walls run past the corners so the four skins close up.
  const length = alongX ? w + WALL * 2 : d;
  const offset = (alongX ? d : w) / 2 + WALL / 2;
  const sign = side === "north" || side === "west" ? -1 : 1;

  const materials = useMemo(() => {
    const list = Array.from({ length: 6 }, () => interior);
    if (spec.exterior.includes(side)) list[OUTER_FACE[side]] = facade;
    return list;
  }, [interior, facade, side, spec.exterior]);

  return (
    <>
      {wallSlabs(length, spec.openings[side]).map((slab, index) => {
        const mid = (slab.along[0] + slab.along[1]) / 2;
        const span = slab.along[1] - slab.along[0];
        const height = slab.y[1] - slab.y[0];
        const y = (slab.y[0] + slab.y[1]) / 2;
        return (
          <mesh
            key={index}
            position={alongX ? [mid, y, sign * offset] : [sign * offset, y, mid]}
            material={materials}
            castShadow
            receiveShadow
          >
            <boxGeometry args={alongX ? [span, height, WALL] : [WALL, height, span]} />
          </mesh>
        );
      })}
    </>
  );
}

/**
 * Frame, sheers and daylight for a window. Authored in a local frame where +X
 * runs along the wall, +Z points into the room and the wall sits at z ∈ [−WALL, 0].
 */
function WindowDressing({ side, spec, opening }: { side: Side; spec: RoomSpec; opening: Opening }) {
  const [w, d] = spec.size;
  const mid = (opening.from + opening.to) / 2;
  const width = opening.to - opening.from;
  const bottom = opening.bottom ?? 0;
  const height = opening.top - bottom;
  const midY = (opening.top + bottom) / 2;

  const placement: Record<Side, { position: Vec3; rotation: number }> = {
    north: { position: [mid, 0, -d / 2], rotation: 0 },
    south: { position: [mid, 0, d / 2], rotation: Math.PI },
    west: { position: [-w / 2, 0, mid], rotation: Math.PI / 2 },
    east: { position: [w / 2, 0, mid], rotation: -Math.PI / 2 },
  };
  const { position, rotation } = placement[side];
  const mullions = Math.max(2, Math.round(width / 1.25) + 1);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Daylight behind the glass. Single-sided, so it is invisible from the garden. */}
      <mesh position={[0, midY, -WALL - 0.3]}>
        <planeGeometry args={[width + 1, height + 0.8]} />
        <meshBasicMaterial color="#fbf6ea" toneMapped={false} fog={false} />
      </mesh>
      {[bottom + 0.02, opening.top - 0.02].map((y) => (
        <mesh key={y} position={[0, y, -WALL / 2]} castShadow>
          <boxGeometry args={[width, 0.04, 0.06]} />
          <meshStandardMaterial color={TRIM} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {Array.from({ length: mullions }, (_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + 0.02 + (i * (width - 0.04)) / (mullions - 1), midY, -WALL / 2]}
          castShadow
        >
          <boxGeometry args={[0.04, height, 0.06]} />
          <meshStandardMaterial color={TRIM} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, bottom - 0.015, 0.04]} receiveShadow>
        <boxGeometry args={[width + 0.1, 0.03, 0.2]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.5} />
      </mesh>
      {/* Sheer curtains drawn back to either side, on a brass rod. */}
      <mesh position={[0, 2.68, 0.09]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, width + 1.2, 10]} />
        <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (width / 2 + 0.26), 1.36, 0.09]} castShadow>
          <boxGeometry args={[0.52, 2.62, 0.05]} />
          <meshStandardMaterial color="#f1ebdf" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// One room: floor, walls, ceiling, windows, thresholds
// ---------------------------------------------------------------------------
function RoomShell({
  spec,
  facade,
  lowQuality,
}: {
  spec: RoomSpec;
  facade: THREE.Material;
  lowQuality: boolean;
}) {
  const [w, d] = spec.size;
  const floor = FLOORS[spec.floor];
  const textures = useTiledTextures(
    floor.surface,
    [(floor.repeat[0] * w) / ROOM.width, (floor.repeat[1] * d) / ROOM.depth],
    lowQuality ? 256 : 512,
  );
  const interior = useMemo(
    () => new THREE.MeshStandardMaterial({ color: spec.wall, roughness: 0.94 }),
    [spec.wall],
  );
  useEffect(() => () => interior.dispose(), [interior]);

  return (
    <group position={[spec.center[0], 0, spec.center[1]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <SurfaceMaterial textures={textures} color={floor.surface.base} />
      </mesh>

      {SIDES.map((side) => (
        <Wall key={side} side={side} spec={spec} interior={interior} facade={facade} />
      ))}
      {SIDES.flatMap((side) =>
        (spec.openings[side] ?? [])
          .filter((opening) => opening.window)
          .map((opening) => (
            <WindowDressing
              key={`${side}-${opening.from}`}
              side={side}
              spec={spec}
              opening={opening}
            />
          )),
      )}

      {/* Timber thresholds in the doorways. Each shared door is drawn once, by the room to its west or south. */}
      {(spec.openings.east ?? []).map((opening) => (
        <mesh
          key={opening.from}
          position={[w / 2 + WALL, 0.004, (opening.from + opening.to) / 2]}
          receiveShadow
        >
          <boxGeometry args={[WALL * 2 + 0.02, 0.008, opening.to - opening.from]} />
          <meshStandardMaterial color="#6b4a33" roughness={0.6} />
        </mesh>
      ))}
      {spec.id === "foyer" &&
        (spec.openings.north ?? []).map((opening) => (
          <mesh
            key={opening.from}
            position={[(opening.from + opening.to) / 2, 0.004, -d / 2 - WALL]}
            receiveShadow
          >
            <boxGeometry args={[opening.to - opening.from, 0.008, WALL * 2 + 0.02]} />
            <meshStandardMaterial color="#6b4a33" roughness={0.6} />
          </mesh>
        ))}

      {/* Skirting on the solid north wall. */}
      {!spec.openings.north && (
        <mesh position={[0, 0.045, -d / 2 + 0.008]}>
          <boxGeometry args={[w, 0.09, 0.016]} />
          <meshStandardMaterial color="#f3efe7" roughness={0.7} />
        </mesh>
      )}

      <mesh position={[0, CEILING + 0.05, 0]} castShadow>
        <boxGeometry args={[w + WALL * 2, 0.1, d + WALL * 2]} />
        <meshStandardMaterial color="#f5f1e9" roughness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Foyer furniture (the other rooms reuse the studio layouts)
// ---------------------------------------------------------------------------
function FoyerFurniture() {
  const half = FOYER.width / 2;
  return (
    <>
      <Rug variant="wool" size={[1.3, 2.1]} />
      <group position={[-half + 0.27, 0, -0.45]} rotation={[0, Math.PI / 2, 0]}>
        <Credenza width={1.3} />
      </group>
      <group position={[-half + 0.02, 1.7, -0.45]} rotation={[0, Math.PI / 2, 0]} scale={0.62}>
        <WallArt variant="minimal" />
      </group>
      <group position={[half - 0.26, 0, 0.25]} rotation={[0, -Math.PI / 2, 0]}>
        <Bench color="#a79f92" />
      </group>
      <group position={[half - 0.34, 0, -1.08]} scale={0.85}>
        <Plant variant="gallery" />
      </group>
      <group position={[0, CEILING, 0]}>
        <Pendant drop={0.75} />
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------
// Front door: swings open as the visitor walks up the path
// ---------------------------------------------------------------------------
function FrontDoor() {
  const hinge = useRef<THREE.Group>(null);
  const width = FRONT_DOOR.to - FRONT_DOOR.from;
  const height = FRONT_DOOR.top;

  useFrame(({ camera }) => {
    if (!hinge.current) return;
    // Closed from the far end of the path, fully open two metres from the step.
    const t = THREE.MathUtils.clamp((FRONT_Z + 5.6 - camera.position.z) / 3.6, 0, 1);
    hinge.current.rotation.y = t * t * (3 - 2 * t) * 1.72;
  });

  return (
    <group ref={hinge} position={[FRONT_DOOR.from, 0, FRONT_Z - WALL / 2]}>
      {/* No shadow casting: the sun-patch in the foyer is baked once, with the door open. */}
      <mesh position={[width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[width - 0.02, height - 0.02, 0.045]} />
        <meshStandardMaterial color="#6b4a33" roughness={0.55} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[width - 0.12, 1.05, k * 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.05, 12]} />
          <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />
        </mesh>
      ))}
      <mesh position={[width - 0.12, 1.05, 0.075]}>
        <boxGeometry args={[0.03, 0.26, 0.02]} />
        <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />
      </mesh>
      <mesh position={[width - 0.12, 1.05, -0.075]}>
        <boxGeometry args={[0.03, 0.26, 0.02]} />
        <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Garden, path, roof
// ---------------------------------------------------------------------------
const GROUND: SurfaceSpec = {
  pattern: "concrete",
  base: "#8f9977",
  accent: "#7c8766",
  roughness: 0.95,
}; // lawn
const PAVING: SurfaceSpec = {
  pattern: "tiles",
  base: "#ddd5c6",
  accent: "#bdb3a1",
  rows: 2,
  roughness: 0.7,
};

function Exterior({ facade, lowQuality }: { facade: THREE.Material; lowQuality: boolean }) {
  const size = lowQuality ? 256 : 512;
  const ground = useTiledTextures(GROUND, [36, 36], size);
  const paving = useTiledTextures(PAVING, [1, 6], size);
  const centerX = (HOUSE.minX + HOUSE.maxX) / 2;
  const roofY = CEILING + 0.2;
  const foyerOuter = FOYER.width / 2 + WALL;

  return (
    <>
      {/* Ground and the slab the house stands on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.004, 4]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <SurfaceMaterial textures={ground} color={GROUND.base} normals={false} />
      </mesh>
      <mesh position={[centerX, -0.03, 0]} receiveShadow>
        <boxGeometry args={[HOUSE.maxX - HOUSE.minX, 0.06, HOUSE.maxZ - HOUSE.minZ]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.03, (HOUSE.maxZ + FRONT_Z) / 2]} receiveShadow>
        <boxGeometry args={[foyerOuter * 2, 0.06, FRONT_Z - HOUSE.maxZ]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.9} />
      </mesh>

      {/* Garden path and the step at the door */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, FRONT_Z + 7]} receiveShadow>
        <planeGeometry args={[1.9, 12.6]} />
        <SurfaceMaterial textures={paving} color={PAVING.base} />
      </mesh>
      <mesh position={[0, 0.012, FRONT_Z + 0.55]} receiveShadow castShadow>
        <boxGeometry args={[2.7, 0.024, 1.1]} />
        <meshStandardMaterial color="#d8d0c1" roughness={0.6} />
      </mesh>

      {/* Olive trees either side of the door, clipped hedges under the living room wall */}
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 1.62, 0, FRONT_Z + 0.5]} scale={1.2}>
          <Plant variant="minimal" />
        </group>
      ))}
      {[-1, 1].map((k) => (
        <mesh
          key={k}
          position={[k * (foyerOuter + 0.95), 0.3, HOUSE.maxZ + 0.45]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#75805f" roughness={1} />
        </mesh>
      ))}
      {/* Wall light beside the door */}
      <mesh position={[FRONT_DOOR.to + 0.42, 1.78, FRONT_Z + 0.04]}>
        <boxGeometry args={[0.1, 0.3, 0.08]} />
        <meshStandardMaterial
          color="#ffe2b0"
          emissive="#ffe2b0"
          emissiveIntensity={1.4}
          roughness={0.9}
        />
      </mesh>

      {/* Flat roof with a deep overhang; it also keeps the sun out of everything but the openings. */}
      <mesh position={[centerX, roofY, 0]} castShadow receiveShadow material={facade}>
        <boxGeometry args={[HOUSE.maxX - HOUSE.minX + 1, 0.2, HOUSE.maxZ - HOUSE.minZ + 1]} />
      </mesh>
      <mesh
        position={[0, roofY, (HOUSE.maxZ + FRONT_Z) / 2 + 0.35]}
        castShadow
        receiveShadow
        material={facade}
      >
        <boxGeometry args={[foyerOuter * 2 + 1, 0.2, FRONT_Z - HOUSE.maxZ + 0.7]} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// House
// ---------------------------------------------------------------------------
export function House({ lowQuality = false }: { lowQuality?: boolean }) {
  const facade = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FACADE, roughness: 0.9 }),
    [],
  );
  useEffect(() => () => facade.dispose(), [facade]);
  useEffect(() => tourMark("scene-built"), []);

  // Only draw the furniture of rooms near the camera.
  const furniture = useRef<(THREE.Group | null)[]>([]);
  useFrame(({ camera }) => {
    ROOMS.forEach((room, index) => {
      const group = furniture.current[index];
      if (group) group.visible = Math.abs(camera.position.x - room.center[0]) < CULL_DISTANCE;
    });
  });

  return (
    <group>
      <Exterior facade={facade} lowQuality={lowQuality} />
      <FrontDoor />
      {ROOMS.map((room, index) => (
        <group key={room.id}>
          <RoomShell spec={room} facade={facade} lowQuality={lowQuality} />
          <group
            ref={(node) => {
              furniture.current[index] = node;
            }}
            position={[room.center[0], 0, room.center[1]]}
          >
            {room.layout ? (
              <RoomFurniture layout={room.layout} config={room.config} />
            ) : (
              <FoyerFurniture />
            )}
          </group>
        </group>
      ))}
    </group>
  );
}
