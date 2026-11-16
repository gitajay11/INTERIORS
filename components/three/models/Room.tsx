"use client";

/**
 * Room shell: floor slab, four walls (one with a window), ceiling and curtains.
 *
 * Walls have real thickness and are hidden while the camera is behind them
 * ("dollhouse" cut-away), so the room can be orbited from any angle and still
 * be seen into.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FLOORS, ROOM, type FloorId } from "../catalog";
import { getSurfaceTextures } from "../textures";

const { width: W, depth: D, height: H } = ROOM;
const T = 0.12; // wall thickness
const WINDOW = { z: -0.2, width: 2.6, bottom: 0.45, top: 2.45 };

interface RoomProps {
  wallColor: string;
  floor: FloorId;
  /** Lower-resolution floor textures for weak devices. */
  lowQuality?: boolean;
}

export function Room({ wallColor, floor, lowQuality = false }: RoomProps) {
  const invalidate = useThree((s) => s.invalidate);

  // One material shared by all four walls, so a single tween recolours the room.
  const wallMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.94 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial colour only; later changes tween
    [],
  );
  const targetColor = useMemo(() => new THREE.Color(wallColor), [wallColor]);
  useEffect(() => invalidate(), [targetColor, floor, invalidate]);
  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);

  const floorTextures = useMemo(() => {
    const option = FLOORS[floor];
    const textures = getSurfaceTextures(option.surface, lowQuality ? 256 : 512);
    for (const texture of Object.values(textures)) texture.repeat.set(...option.repeat);
    return textures;
  }, [floor, lowQuality]);

  const back = useRef<THREE.Group>(null);
  const front = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  const ceiling = useRef<THREE.Mesh>(null);

  useFrame(({ camera }, delta) => {
    // Smooth wall colour tween (frame-rate independent).
    const color = wallMaterial.color;
    const distance =
      Math.abs(color.r - targetColor.r) +
      Math.abs(color.g - targetColor.g) +
      Math.abs(color.b - targetColor.b);
    if (distance > 0.002) {
      color.lerp(targetColor, 1 - Math.exp(-delta * 7));
      invalidate();
    } else if (distance > 0) {
      color.copy(targetColor);
    }

    // Cut-away: hide whatever stands between the camera and the room.
    const { x, y, z } = camera.position;
    if (back.current) back.current.visible = z > -D / 2;
    if (front.current) front.current.visible = z < D / 2;
    if (left.current) left.current.visible = x > -W / 2;
    if (right.current) right.current.visible = x < W / 2;
    // The ceiling only shows from inside the room; from outside it would hide the interior.
    if (ceiling.current) {
      ceiling.current.visible = y < H && Math.abs(x) < W / 2 && Math.abs(z) < D / 2;
    }
  });

  const sideZ = {
    // left wall is split around the window opening
    nearLen: D / 2 - (WINDOW.z + WINDOW.width / 2),
    farLen: WINDOW.z - WINDOW.width / 2 + D / 2,
  };

  return (
    <group>
      {/* ---- Floor ---- */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[W + T * 2, 0.12, D + T * 2]} />
        <meshStandardMaterial color="#c9c0b0" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          key={floor}
          map={floorTextures.map}
          normalMap={floorTextures.normalMap}
          roughnessMap={floorTextures.roughnessMap}
          roughness={1}
          envMapIntensity={0.9}
        />
      </mesh>

      {/* ---- Back wall ---- */}
      <group ref={back}>
        <mesh position={[0, H / 2, -D / 2 - T / 2]} material={wallMaterial} receiveShadow>
          <boxGeometry args={[W + T * 2, H, T]} />
        </mesh>
        <Baseboard length={W} position={[0, 0.045, -D / 2 + 0.008]} />
      </group>

      {/* ---- Front wall ---- */}
      <group ref={front}>
        <mesh position={[0, H / 2, D / 2 + T / 2]} material={wallMaterial} receiveShadow>
          <boxGeometry args={[W + T * 2, H, T]} />
        </mesh>
        <Baseboard length={W} position={[0, 0.045, D / 2 - 0.008]} />
      </group>

      {/* ---- Right wall ---- */}
      <group ref={right}>
        <mesh position={[W / 2 + T / 2, H / 2, 0]} material={wallMaterial} receiveShadow>
          <boxGeometry args={[T, H, D]} />
        </mesh>
        <Baseboard length={D} position={[W / 2 - 0.008, 0.045, 0]} rotated />
      </group>

      {/* ---- Left wall with window ---- */}
      <group ref={left}>
        <group position={[-W / 2 - T / 2, 0, 0]}>
          <mesh position={[0, WINDOW.bottom / 2, WINDOW.z]} material={wallMaterial} receiveShadow>
            <boxGeometry args={[T, WINDOW.bottom, WINDOW.width]} />
          </mesh>
          <mesh
            position={[0, (H + WINDOW.top) / 2, WINDOW.z]}
            material={wallMaterial}
            receiveShadow
          >
            <boxGeometry args={[T, H - WINDOW.top, WINDOW.width]} />
          </mesh>
          <mesh
            position={[0, H / 2, -D / 2 + sideZ.farLen / 2]}
            material={wallMaterial}
            receiveShadow
          >
            <boxGeometry args={[T, H, sideZ.farLen]} />
          </mesh>
          <mesh
            position={[0, H / 2, D / 2 - sideZ.nearLen / 2]}
            material={wallMaterial}
            receiveShadow
          >
            <boxGeometry args={[T, H, sideZ.nearLen]} />
          </mesh>
        </group>
        <Baseboard
          length={sideZ.farLen}
          position={[-W / 2 + 0.008, 0.045, -D / 2 + sideZ.farLen / 2]}
          rotated
        />
        <Baseboard
          length={sideZ.nearLen}
          position={[-W / 2 + 0.008, 0.045, D / 2 - sideZ.nearLen / 2]}
          rotated
        />
        <WindowUnit />
      </group>

      {/* ---- Shadow casters ----
          Invisible copies of the window wall and ceiling that always cast shadows, so
          sunlight only enters through the window even while those parts are cut away. */}
      <group position={[-W / 2 - T / 2, 0, 0]}>
        <ShadowCaster
          size={[T, WINDOW.bottom, WINDOW.width]}
          position={[0, WINDOW.bottom / 2, WINDOW.z]}
        />
        <ShadowCaster
          size={[T, H - WINDOW.top + 0.4, WINDOW.width]}
          position={[0, (H + WINDOW.top) / 2 + 0.2, WINDOW.z]}
        />
        <ShadowCaster
          size={[T, H + 0.4, sideZ.farLen + 1]}
          position={[0, H / 2 + 0.2, -D / 2 + sideZ.farLen / 2 - 0.5]}
        />
        <ShadowCaster
          size={[T, H + 0.4, sideZ.nearLen + 1]}
          position={[0, H / 2 + 0.2, D / 2 - sideZ.nearLen / 2 + 0.5]}
        />
      </group>
      <ShadowCaster size={[W + 2, 0.1, D + 2]} position={[0, H + 0.05, 0]} />

      {/* ---- Ceiling ---- */}
      <mesh ref={ceiling} position={[0, H + 0.05, 0]}>
        <boxGeometry args={[W + T * 2, 0.1, D + T * 2]} />
        <meshStandardMaterial color="#f5f1e9" roughness={1} />
      </mesh>
    </group>
  );
}

function ShadowCaster({
  size,
  position,
}: {
  size: [number, number, number];
  position: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );
}

function Baseboard({
  length,
  position,
  rotated = false,
}: {
  length: number;
  position: [number, number, number];
  rotated?: boolean;
}) {
  return (
    <mesh position={position} rotation={[0, rotated ? Math.PI / 2 : 0, 0]}>
      <boxGeometry args={[length, 0.09, 0.016]} />
      <meshStandardMaterial color="#f3efe7" roughness={0.7} />
    </mesh>
  );
}

/** Window frame, glass, daylight panel and pleated sheer curtains. */
function WindowUnit() {
  const h = WINDOW.top - WINDOW.bottom;
  const midY = (WINDOW.top + WINDOW.bottom) / 2;
  const x = -W / 2 - T / 2;
  const pleats = 9;
  return (
    <group>
      {/* daylight seen through the glass (unlit, so it reads as bright sky) */}
      <mesh position={[x - 0.35, midY, WINDOW.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[WINDOW.width + 0.9, h + 0.8]} />
        <meshBasicMaterial color="#fbf6ea" toneMapped={false} />
      </mesh>
      <mesh position={[x, midY, WINDOW.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[WINDOW.width, h]} />
        <meshStandardMaterial color="#dfe9ec" transparent opacity={0.18} roughness={0.05} />
      </mesh>
      {/* frame: outer rails + two mullions */}
      {[WINDOW.bottom + 0.02, WINDOW.top - 0.02].map((y) => (
        <mesh key={y} position={[x, y, WINDOW.z]} castShadow>
          <boxGeometry args={[0.07, 0.04, WINDOW.width]} />
          <meshStandardMaterial color="#3a342e" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {[-0.5, -1 / 6, 1 / 6, 0.5].map((k) => (
        <mesh key={k} position={[x, midY, WINDOW.z + k * (WINDOW.width - 0.04)]} castShadow>
          <boxGeometry args={[0.07, h, 0.04]} />
          <meshStandardMaterial color="#3a342e" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[-W / 2 + 0.06, WINDOW.bottom - 0.015, WINDOW.z]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.03, WINDOW.width + 0.1]} />
        <meshStandardMaterial color="#e9e4da" roughness={0.5} />
      </mesh>
      {/* curtain rod + sheers */}
      <mesh position={[-W / 2 + 0.1, 2.68, WINDOW.z]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, WINDOW.width + 1.1, 12]} />
        <meshStandardMaterial color="#b3904f" roughness={0.3} metalness={1} />
      </mesh>
      {[-1, 1].map((side) =>
        Array.from({ length: pleats }, (_, i) => (
          <mesh
            key={`${side}-${i}`}
            position={[-W / 2 + 0.1, 1.36, WINDOW.z + side * (WINDOW.width / 2 + 0.05 + i * 0.055)]}
            castShadow
          >
            <cylinderGeometry args={[0.036, 0.042, 2.62, 10]} />
            <meshStandardMaterial color="#f1ebdf" roughness={1} />
          </mesh>
        )),
      )}
    </group>
  );
}
