"use client";

/**
 * Procedural furniture kit. Every piece is built from a handful of primitives so
 * the site runs without any model downloads. Pieces sit on y = 0, are centred on
 * the origin and face +Z; layouts position and rotate them.
 *
 * To replace a piece with a GLB, see README → "Adding 3D models & materials".
 */
import { useMemo } from "react";
import * as THREE from "three";
import { Ball, Box, Brass, Cyl, Fabric, Glow, Matte, Stone, Wood, rand } from "./primitives";

type Vec3 = [number, number, number];
const DARK_WOOD = "#5a4130";
const OAK = "#b99468";

// ============================================================================
// Sofas
// ============================================================================
function Legs({
  w,
  d,
  h = 0.12,
  color = DARK_WOOD,
}: {
  w: number;
  d: number;
  h?: number;
  color?: string;
}) {
  return (
    <>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Cyl key={`${x}${z}`} r={[0.025, 0.018]} h={h} p={[(x * w) / 2, h / 2, (z * d) / 2]}>
            <Wood color={color} />
          </Cyl>
        )),
      )}
    </>
  );
}

function SofaLounge({ color, width = 2.4 }: { color: string; width?: number }) {
  const seats = 3;
  const inner = width - 0.44;
  const cw = inner / seats;
  return (
    <group>
      <Legs w={width - 0.2} d={0.75} />
      <Box s={[width, 0.26, 0.95]} p={[0, 0.25, 0]} r={0.05}>
        <Fabric color={color} />
      </Box>
      <Box s={[width, 0.5, 0.2]} p={[0, 0.6, -0.375]} r={0.08}>
        <Fabric color={color} />
      </Box>
      {[-1, 1].map((x) => (
        <Box key={x} s={[0.2, 0.36, 0.95]} p={[x * (width / 2 - 0.1), 0.52, 0]} r={0.08}>
          <Fabric color={color} />
        </Box>
      ))}
      {Array.from({ length: seats }, (_, i) => {
        const x = -inner / 2 + cw / 2 + i * cw;
        return (
          <group key={i}>
            <Box s={[cw - 0.02, 0.16, 0.7]} p={[x, 0.46, 0.1]} r={0.06}>
              <Fabric color={color} />
            </Box>
            <Box s={[cw - 0.04, 0.36, 0.16]} p={[x, 0.7, -0.2]} rot={[-0.16, 0, 0]} r={0.07}>
              <Fabric color={color} />
            </Box>
          </group>
        );
      })}
      {/* accent cushion */}
      <Box s={[0.4, 0.4, 0.12]} p={[inner / 2 - 0.25, 0.72, 0.02]} rot={[-0.3, -0.25, 0]} r={0.05}>
        <Fabric color="#8a7a5c" />
      </Box>
    </group>
  );
}

function SofaCurve({ color }: { color: string }) {
  // Pill-shaped plan: a box capped with two half-cylinders.
  return (
    <group>
      <Box s={[1.5, 0.4, 1.0]} p={[0, 0.24, 0]} r={0.06}>
        <Fabric color={color} />
      </Box>
      {[-1, 1].map((x) => (
        <Cyl key={x} r={0.5} h={0.4} p={[x * 0.75, 0.24, 0]}>
          <Fabric color={color} />
        </Cyl>
      ))}
      <Box s={[1.5, 0.46, 0.3]} p={[0, 0.62, -0.35]} r={0.14}>
        <Fabric color={color} />
      </Box>
      {[-1, 1].map((x) => (
        <Ball key={x} r={0.3} p={[x * 0.86, 0.6, -0.22]} scale={[1.1, 0.82, 0.8]}>
          <Fabric color={color} />
        </Ball>
      ))}
      <Cyl r={0.2} h={0.5} p={[0.35, 0.6, -0.08]} rot={[0, 0, Math.PI / 2]}>
        <Fabric color="#8a7a5c" />
      </Cyl>
      <Box s={[2.3, 0.04, 0.8]} p={[0, 0.03, 0]} r={0.015}>
        <Wood color={DARK_WOOD} />
      </Box>
    </group>
  );
}

function SofaSectional({ color }: { color: string }) {
  return (
    <group position={[-0.2, 0, 0]}>
      <SofaLounge color={color} width={2.6} />
      {/* chaise */}
      <group position={[1.75, 0, 0.35]}>
        <Legs w={0.75} d={1.4} />
        <Box s={[0.95, 0.26, 1.65]} p={[0, 0.25, 0]} r={0.05}>
          <Fabric color={color} />
        </Box>
        <Box s={[0.9, 0.16, 1.55]} p={[0, 0.46, 0.02]} r={0.06}>
          <Fabric color={color} />
        </Box>
        <Box s={[0.95, 0.5, 0.2]} p={[0, 0.6, -0.725]} r={0.08}>
          <Fabric color={color} />
        </Box>
      </group>
    </group>
  );
}

export function Sofa({ variant, color }: { variant: string; color: string }) {
  if (variant === "curve") return <SofaCurve color={color} />;
  if (variant === "sectional") return <SofaSectional color={color} />;
  return <SofaLounge color={color} />;
}

// ============================================================================
// Coffee tables
// ============================================================================
export function CoffeeTable({ variant }: { variant: string }) {
  if (variant === "slab") {
    return (
      <group>
        <Box s={[1.35, 0.07, 0.7]} p={[0, 0.36, 0]} r={0.02}>
          <Wood color={OAK} />
        </Box>
        {[-1, 1].map((x) => (
          <Box key={x} s={[0.12, 0.33, 0.6]} p={[x * 0.5, 0.165, 0]} r={0.02}>
            <Wood color={OAK} />
          </Box>
        ))}
        <TableTop y={0.395} />
      </group>
    );
  }
  if (variant === "nest") {
    return (
      <group>
        {(
          [
            [0.42, 0.44, -0.18, 0],
            [0.3, 0.34, 0.34, 0.22],
          ] as const
        ).map(([r, h, x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <Cyl r={r} h={0.03} p={[0, h, 0]}>
              <Stone color={i === 0 ? "#3a3632" : "#d8cebb"} />
            </Cyl>
            {[0, 1, 2].map((k) => {
              const a = (k / 3) * Math.PI * 2;
              return (
                <Cyl
                  key={k}
                  r={0.012}
                  h={h}
                  p={[Math.cos(a) * r * 0.8, h / 2, Math.sin(a) * r * 0.8]}
                >
                  <Brass />
                </Cyl>
              );
            })}
          </group>
        ))}
      </group>
    );
  }
  return (
    <group>
      <Cyl r={0.52} h={0.07} p={[0, 0.345, 0]} segments={64}>
        <Stone />
      </Cyl>
      <Cyl r={[0.3, 0.36]} h={0.31} p={[0, 0.155, 0]} segments={48}>
        <Stone color="#c9bda8" />
      </Cyl>
      <TableTop y={0.38} />
    </group>
  );
}

/** Books and a small vase to dress a table top. */
function TableTop({ y }: { y: number }) {
  return (
    <group position={[0, y, 0]}>
      <Box s={[0.3, 0.03, 0.22]} p={[-0.14, 0.015, 0.05]} rot={[0, 0.2, 0]} r={0.004}>
        <Matte color="#7d6f5a" />
      </Box>
      <Box s={[0.26, 0.025, 0.19]} p={[-0.14, 0.043, 0.05]} rot={[0, -0.1, 0]} r={0.004}>
        <Matte color="#e6dfd2" />
      </Box>
      <Cyl r={[0.04, 0.07]} h={0.16} p={[0.2, 0.08, -0.06]}>
        <Matte color="#2f2c29" roughness={0.4} />
      </Cyl>
    </group>
  );
}

// ============================================================================
// Armchairs
// ============================================================================
export function Armchair({ variant, color }: { variant: string; color: string }) {
  if (variant === "frame") {
    return (
      <group>
        {[-1, 1].map((x) => (
          <group key={x} position={[x * 0.36, 0, 0]}>
            <Box s={[0.04, 0.6, 0.04]} p={[0, 0.3, 0.3]} r={0.01}>
              <Wood color={OAK} />
            </Box>
            <Box s={[0.04, 0.78, 0.04]} p={[0, 0.39, -0.32]} rot={[-0.12, 0, 0]} r={0.01}>
              <Wood color={OAK} />
            </Box>
            <Box s={[0.05, 0.035, 0.74]} p={[0, 0.58, 0]} r={0.012}>
              <Wood color={OAK} />
            </Box>
            <Box s={[0.04, 0.04, 0.66]} p={[0, 0.3, 0]} r={0.01}>
              <Wood color={OAK} />
            </Box>
          </group>
        ))}
        <Box s={[0.66, 0.1, 0.62]} p={[0, 0.38, 0.02]} rot={[-0.08, 0, 0]} r={0.04}>
          <Fabric color={color} />
        </Box>
        <Box s={[0.66, 0.46, 0.09]} p={[0, 0.66, -0.3]} rot={[-0.22, 0, 0]} r={0.04}>
          <Fabric color={color} />
        </Box>
      </group>
    );
  }
  return (
    <group>
      <Cyl r={0.42} h={0.3} p={[0, 0.24, 0]}>
        <Fabric color={color} />
      </Cyl>
      {/* barrel back: an open half-cylinder shell */}
      <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.44, 0.5, 40, 1, true, -Math.PI * 0.62, Math.PI * 1.24]} />
        <meshStandardMaterial color={color} roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <Cyl r={0.36} h={0.12} p={[0, 0.43, 0.03]}>
        <Fabric color={color} />
      </Cyl>
      <Cyl r={0.3} h={0.08} p={[0, 0.05, 0]}>
        <Wood color={DARK_WOOD} />
      </Cyl>
    </group>
  );
}

// ============================================================================
// Rugs
// ============================================================================
export function Rug({ variant, size = [3.3, 2.3] }: { variant: string; size?: [number, number] }) {
  if (variant === "jute") {
    const r = Math.min(size[0], size[1]) / 2 + 0.25;
    return (
      <group>
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <cylinderGeometry args={[r, r, 0.016, 72]} />
          <meshStandardMaterial color="#c4a877" roughness={1} />
        </mesh>
        {[0.82, 0.6, 0.38].map((k) => (
          <mesh key={k} position={[0, 0.0175, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[r * k - 0.02, r * k, 72]} />
            <meshStandardMaterial color="#a88d5e" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.008, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.016, size[1]]} />
        <meshStandardMaterial color="#b9ac97" roughness={1} />
      </mesh>
      <mesh position={[0, 0.011, 0]} receiveShadow>
        <boxGeometry args={[size[0] - 0.3, 0.016, size[1] - 0.3]} />
        <meshStandardMaterial color="#e2dacb" roughness={1} />
      </mesh>
    </group>
  );
}

// ============================================================================
// Lamps
// ============================================================================
export function FloorLamp({ variant, lit = true }: { variant: string; lit?: boolean }) {
  const arc = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(0, 1.2, 0),
      new THREE.Vector3(-0.25, 1.85, 0),
      new THREE.Vector3(-0.8, 2.0, 0),
      new THREE.Vector3(-1.15, 1.78, 0),
    ]);
    return new THREE.TubeGeometry(curve, 48, 0.014, 8, false);
  }, []);

  if (variant === "tripod") {
    return (
      <group>
        {[0, 1, 2].map((k) => {
          const a = (k / 3) * Math.PI * 2 + 0.4;
          return (
            <group key={k} rotation={[0, a, 0]}>
              <Cyl r={0.016} h={1.36} p={[0.16, 0.66, 0]} rot={[0, 0, 0.24]}>
                <Wood color={OAK} />
              </Cyl>
            </group>
          );
        })}
        <Cyl r={[0.2, 0.26]} h={0.34} p={[0, 1.48, 0]} open>
          <meshStandardMaterial
            color="#f1e6d2"
            emissive="#ffdca8"
            emissiveIntensity={lit ? 0.9 : 0}
            roughness={1}
            side={THREE.DoubleSide}
          />
        </Cyl>
        {lit && (
          <pointLight
            position={[0, 1.45, 0]}
            color="#ffd9a0"
            intensity={2.2}
            distance={5}
            decay={2}
          />
        )}
      </group>
    );
  }
  return (
    <group>
      <Cyl r={0.2} h={0.05} p={[0, 0.025, 0]}>
        <Stone color="#e8e2d6" />
      </Cyl>
      <mesh geometry={arc} castShadow>
        <Brass />
      </mesh>
      <mesh position={[-1.15, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#b3904f"
          roughness={0.3}
          metalness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Ball r={0.06} p={[-1.15, 1.72, 0]}>
        <Glow intensity={lit ? 2.4 : 0} />
      </Ball>
      {lit && (
        <pointLight
          position={[-1.15, 1.6, 0]}
          color="#ffd9a0"
          intensity={2.6}
          distance={5}
          decay={2}
        />
      )}
    </group>
  );
}

export function TableLamp({ lit = true }: { lit?: boolean }) {
  return (
    <group>
      <Cyl r={[0.035, 0.06]} h={0.22} p={[0, 0.11, 0]}>
        <Stone color="#ded5c3" />
      </Cyl>
      <Cyl r={[0.09, 0.13]} h={0.17} p={[0, 0.3, 0]} open>
        <meshStandardMaterial
          color="#f1e6d2"
          emissive="#ffdca8"
          emissiveIntensity={lit ? 0.9 : 0}
          roughness={1}
          side={THREE.DoubleSide}
        />
      </Cyl>
      {lit && (
        <pointLight
          position={[0, 0.32, 0]}
          color="#ffd9a0"
          intensity={0.9}
          distance={3}
          decay={2}
        />
      )}
    </group>
  );
}

export function Pendant({ drop = 0.9, lit = true }: { drop?: number; lit?: boolean }) {
  return (
    <group>
      <Cyl r={0.004} h={drop} p={[0, -drop / 2, 0]} segments={6}>
        <Matte color="#2a2724" />
      </Cyl>
      <Cyl r={[0.05, 0.19]} h={0.2} p={[0, -drop - 0.1, 0]} open>
        <meshStandardMaterial
          color="#b3904f"
          roughness={0.3}
          metalness={1}
          side={THREE.DoubleSide}
        />
      </Cyl>
      <Ball r={0.045} p={[0, -drop - 0.14, 0]}>
        <Glow intensity={lit ? 2.4 : 0} />
      </Ball>
      {lit && (
        <pointLight
          position={[0, -drop - 0.25, 0]}
          color="#ffd9a0"
          intensity={1.6}
          distance={4}
          decay={2}
        />
      )}
    </group>
  );
}

// ============================================================================
// Shelving
// ============================================================================
const BOOK_COLORS = ["#8a7a5c", "#3f463c", "#c8b99d", "#6f4c33", "#e6dfd2", "#a8663f", "#4a4743"];

function ShelfItems({ width, seed }: { width: number; seed: number }) {
  const items: React.ReactNode[] = [];
  let x = -width / 2 + 0.06;
  let i = 0;
  while (x < width / 2 - 0.12 && i < 14) {
    const r = rand(seed * 13 + i);
    if (r < 0.62) {
      const w = 0.03 + rand(seed + i * 3) * 0.035;
      const h = 0.2 + rand(seed + i * 7) * 0.1;
      items.push(
        <Box key={i} s={[w, h, 0.2]} p={[x + w / 2, h / 2, 0]} r={0.004}>
          <Matte color={BOOK_COLORS[Math.floor(rand(seed * 5 + i) * BOOK_COLORS.length)]} />
        </Box>,
      );
      x += w + 0.004;
    } else if (r < 0.8) {
      items.push(
        <Cyl key={i} r={[0.035, 0.06]} h={0.2} p={[x + 0.1, 0.1, 0]}>
          <Matte color={r < 0.71 ? "#d8cebb" : "#2f2c29"} roughness={0.5} />
        </Cyl>,
      );
      x += 0.24;
    } else {
      x += 0.14;
    }
    i++;
  }
  return <>{items}</>;
}

export function OpenShelf({
  seed = 1,
  width = 1.4,
  height = 2.05,
}: {
  seed?: number;
  width?: number;
  height?: number;
}) {
  const levels = 5;
  const gap = (height - 0.1) / levels;
  return (
    <group>
      {[-1, 1].map((x) => (
        <Box key={x} s={[0.035, height, 0.34]} p={[x * (width / 2), height / 2, 0]} r={0.006}>
          <Wood color={OAK} />
        </Box>
      ))}
      {Array.from({ length: levels + 1 }, (_, i) => (
        <Box key={i} s={[width, 0.03, 0.34]} p={[0, 0.08 + i * gap, 0]} r={0.006}>
          <Wood color={OAK} />
        </Box>
      ))}
      {Array.from({ length: levels }, (_, i) => (
        <group key={i} position={[0, 0.095 + i * gap, 0]}>
          <ShelfItems width={width} seed={seed * 10 + i} />
        </group>
      ))}
    </group>
  );
}

export function Credenza({ width = 1.9, lamp = true }: { width?: number; lamp?: boolean }) {
  const flutes = Math.round(width / 0.05);
  return (
    <group>
      <Legs w={width - 0.3} d={0.3} h={0.16} />
      <Box s={[width, 0.5, 0.45]} p={[0, 0.41, 0]} r={0.02}>
        <Wood color="#7a5a3f" />
      </Box>
      {Array.from({ length: flutes }, (_, i) => (
        <Cyl
          key={i}
          r={0.02}
          h={0.44}
          p={[-width / 2 + 0.025 + i * ((width - 0.05) / (flutes - 1)), 0.41, 0.225]}
          segments={10}
        >
          <Wood color="#7a5a3f" />
        </Cyl>
      ))}
      <Box s={[width + 0.04, 0.03, 0.48]} p={[0, 0.675, 0]} r={0.008}>
        <Stone color="#e3dccf" />
      </Box>
      <group position={[0, 0.69, 0]}>
        {lamp && (
          <group position={[-width / 2 + 0.3, 0, 0]}>
            <TableLamp />
          </group>
        )}
        <Box s={[0.3, 0.035, 0.22]} p={[0.15, 0.018, 0]} r={0.004}>
          <Matte color="#3f463c" />
        </Box>
        <Cyl r={[0.06, 0.09]} h={0.26} p={[width / 2 - 0.3, 0.13, 0]}>
          <Matte color="#cdbfa6" roughness={0.6} />
        </Cyl>
      </group>
    </group>
  );
}

// ============================================================================
// Art & plants
// ============================================================================
export function Plant({ variant }: { variant: string }) {
  if (variant === "minimal") {
    // Olive tree: slim trunk with a loose, airy canopy.
    return (
      <group>
        <Cyl r={[0.2, 0.16]} h={0.36} p={[0, 0.18, 0]}>
          <Stone color="#b7ab97" />
        </Cyl>
        <Cyl r={[0.018, 0.03]} h={1.1} p={[0, 0.9, 0]} rot={[0, 0, 0.05]}>
          <Wood color="#6b5a48" />
        </Cyl>
        {Array.from({ length: 16 }, (_, i) => {
          const a = rand(i) * Math.PI * 2;
          const rr = 0.1 + rand(i + 20) * 0.34;
          return (
            <Ball
              key={i}
              r={0.13 + rand(i + 40) * 0.08}
              p={[Math.cos(a) * rr, 1.45 + rand(i + 60) * 0.5, Math.sin(a) * rr]}
              scale={[1, 0.7, 1]}
            >
              <Matte color={i % 3 === 0 ? "#8a9274" : "#737c5e"} roughness={0.9} />
            </Ball>
          );
        })}
      </group>
    );
  }
  // Fiddle-leaf fig: large upright leaves.
  return (
    <group>
      <Cyl r={[0.2, 0.15]} h={0.42} p={[0, 0.21, 0]}>
        <Matte color="#e6dfd2" roughness={0.7} />
      </Cyl>
      <Cyl r={0.02} h={1.0} p={[0, 0.9, 0]}>
        <Wood color="#5c4a38" />
      </Cyl>
      {Array.from({ length: 14 }, (_, i) => {
        const a = i * 2.4;
        const y = 0.75 + i * 0.065;
        const rr = 0.2 + rand(i) * 0.1;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * rr, y, Math.sin(a) * rr]}
            rotation={[0.5 + rand(i + 9) * 0.5, -a, 0]}
            scale={[0.14, 0.02, 0.22]}
            castShadow
          >
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={i % 2 ? "#4f6142" : "#5d7150"} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function Frame({ s, p, colors }: { s: [number, number]; p: Vec3; colors: string[] }) {
  return (
    <group position={p}>
      <Box s={[s[0], s[1], 0.035]} r={0.004}>
        <Wood color="#2f2a25" />
      </Box>
      <mesh position={[0, 0, 0.019]}>
        <planeGeometry args={[s[0] - 0.06, s[1] - 0.06]} />
        <meshStandardMaterial color={colors[0]} roughness={0.95} />
      </mesh>
      {colors.slice(1).map((color, i) => (
        <mesh
          key={i}
          position={[
            (rand(i + s[0]) - 0.5) * s[0] * 0.4,
            (rand(i + s[1] * 3) - 0.5) * s[1] * 0.4,
            0.02 + i * 0.0006,
          ]}
        >
          <circleGeometry args={[Math.min(s[0], s[1]) * (0.16 + rand(i + 2) * 0.14), 40]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** Wall art, authored on the XY plane facing +Z; place it a few cm in front of a wall. */
export function WallArt({ variant }: { variant: string }) {
  if (variant === "minimal") {
    return (
      <Frame s={[1.7, 1.1]} p={[0, 0, 0]} colors={["#ece5d8", "#c49a7c", "#6f7355", "#3d3a36"]} />
    );
  }
  return (
    <group>
      <Frame s={[0.7, 0.95]} p={[-0.85, 0, 0]} colors={["#ece5d8", "#a8663f", "#3d3a36"]} />
      <Frame s={[0.7, 0.95]} p={[0, 0, 0]} colors={["#e3dccf", "#6f7355", "#c8b99d"]} />
      <Frame s={[0.7, 0.95]} p={[0.85, 0, 0]} colors={["#ece5d8", "#3d4350", "#c49a7c"]} />
    </group>
  );
}

// ============================================================================
// Bedroom
// ============================================================================
export function Bed({ color }: { color: string }) {
  return (
    <group>
      <Box s={[1.95, 0.24, 2.15]} p={[0, 0.2, 0]} r={0.03}>
        <Wood color={OAK} />
      </Box>
      <Legs w={1.75} d={1.95} h={0.1} color={OAK} />
      <Box s={[1.82, 0.22, 2.02]} p={[0, 0.43, 0.02]} r={0.07}>
        <Fabric color="#f2ede4" />
      </Box>
      <Box s={[2.1, 1.05, 0.12]} p={[0, 0.72, -1.1]} r={0.05}>
        <Fabric color={color} />
      </Box>
      <Box s={[1.86, 0.1, 1.35]} p={[0, 0.57, 0.36]} r={0.045}>
        <Fabric color="#e4dccd" />
      </Box>
      <Box s={[1.9, 0.06, 0.5]} p={[0, 0.63, 0.72]} r={0.028}>
        <Fabric color={color} />
      </Box>
      {[-1, 1].map((x) => (
        <group key={x}>
          <Box s={[0.72, 0.16, 0.42]} p={[x * 0.46, 0.63, -0.78]} rot={[0.35, 0, 0]} r={0.07}>
            <Fabric color="#f7f3ec" />
          </Box>
          <Box s={[0.62, 0.15, 0.38]} p={[x * 0.46, 0.66, -0.55]} rot={[0.5, 0, 0]} r={0.07}>
            <Fabric color={color} />
          </Box>
        </group>
      ))}
    </group>
  );
}

export function Nightstand() {
  return (
    <group>
      <Box s={[0.5, 0.38, 0.4]} p={[0, 0.31, 0]} r={0.015}>
        <Wood color={OAK} />
      </Box>
      <Legs w={0.38} d={0.28} h={0.12} color={OAK} />
      <Box s={[0.44, 0.012, 0.01]} p={[0, 0.31, 0.202]} r={0.002}>
        <Brass />
      </Box>
      <group position={[0, 0.5, 0]}>
        <TableLamp />
      </group>
    </group>
  );
}

export function Bench({ color }: { color: string }) {
  return (
    <group>
      <Legs w={1.2} d={0.3} h={0.34} color={OAK} />
      <Box s={[1.4, 0.1, 0.42]} p={[0, 0.39, 0]} r={0.045}>
        <Fabric color={color} />
      </Box>
    </group>
  );
}

// ============================================================================
// Dining & kitchen
// ============================================================================
export function DiningTable({ variant }: { variant: string }) {
  const stoneTop = variant === "round" || variant === "nest";
  return (
    <group>
      <Box s={[2.3, 0.05, 1.0]} p={[0, 0.735, 0]} r={0.02}>
        {stoneTop ? <Stone color="#e3dccf" /> : <Wood color={OAK} />}
      </Box>
      {[-1, 1].map((x) => (
        <Box key={x} s={[0.1, 0.71, 0.7]} p={[x * 0.8, 0.355, 0]} r={0.02}>
          <Wood color={stoneTop ? DARK_WOOD : OAK} />
        </Box>
      ))}
      <Cyl r={[0.13, 0.09]} h={0.1} p={[0, 0.81, 0]}>
        <Matte color="#d8cebb" roughness={0.5} />
      </Cyl>
    </group>
  );
}

export function DiningChair({ color }: { color: string }) {
  return (
    <group>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <Cyl
            key={`${x}${z}`}
            r={0.017}
            h={z < 0 ? 0.84 : 0.44}
            p={[x * 0.2, z < 0 ? 0.42 : 0.22, z * 0.2]}
          >
            <Wood color={DARK_WOOD} />
          </Cyl>
        )),
      )}
      <Box s={[0.46, 0.06, 0.46]} p={[0, 0.46, 0]} r={0.028}>
        <Fabric color={color} />
      </Box>
      <Box s={[0.44, 0.24, 0.04]} p={[0, 0.74, -0.2]} r={0.018}>
        <Fabric color={color} />
      </Box>
    </group>
  );
}

export function Kitchen({ width = 4.8 }: { width?: number }) {
  const doors = 8;
  const dw = (width - 0.7) / doors;
  return (
    <group>
      {/* tall pantry unit */}
      <Box s={[0.7, 2.3, 0.62]} p={[-width / 2 + 0.35, 1.15, 0]} r={0.008}>
        <Wood color="#6e5740" />
      </Box>
      <Box s={[0.012, 0.9, 0.02]} p={[-width / 2 + 0.62, 1.2, 0.32]} r={0.004}>
        <Brass />
      </Box>
      {/* base cabinets */}
      <Box s={[width - 0.7, 0.82, 0.6]} p={[0.35, 0.47, 0]} r={0.006}>
        <Matte color="#ebe5d9" roughness={0.6} />
      </Box>
      <Box s={[width - 0.7, 0.07, 0.52]} p={[0.35, 0.035, -0.02]} r={0.004}>
        <Matte color="#2f2c29" />
      </Box>
      {Array.from({ length: doors }, (_, i) => (
        <group key={i} position={[-width / 2 + 0.7 + dw / 2 + i * dw, 0.47, 0.3]}>
          <Box s={[dw - 0.012, 0.79, 0.014]} r={0.004}>
            <Matte color="#efe9dd" roughness={0.55} />
          </Box>
          <Box s={[0.1, 0.01, 0.02]} p={[0, 0.34, 0.012]} r={0.003}>
            <Brass />
          </Box>
        </group>
      ))}
      {/* worktop + splashback */}
      <Box s={[width - 0.66, 0.035, 0.64]} p={[0.35, 0.9, 0.01]} r={0.008}>
        <Stone color="#e9e4da" />
      </Box>
      <Box s={[width - 0.7, 0.62, 0.015]} p={[0.35, 1.23, -0.29]} r={0.004}>
        <Stone color="#e9e4da" />
      </Box>
      {/* hob, sink and tap */}
      <Box s={[0.62, 0.008, 0.42]} p={[1.3, 0.922, 0]} r={0.002}>
        <Matte color="#1f1d1b" roughness={0.25} />
      </Box>
      <Box s={[0.5, 0.006, 0.36]} p={[-0.4, 0.92, 0.02]} r={0.002}>
        <Matte color="#8c8a86" roughness={0.3} />
      </Box>
      <Cyl r={0.012} h={0.28} p={[-0.4, 1.06, -0.2]}>
        <Brass />
      </Cyl>
      <Cyl r={0.01} h={0.16} p={[-0.4, 1.2, -0.13]} rot={[Math.PI / 2, 0, 0]}>
        <Brass />
      </Cyl>
      {/* open shelf */}
      <Box s={[width - 0.8, 0.035, 0.26]} p={[0.35, 1.72, -0.16]} r={0.008}>
        <Wood color={OAK} />
      </Box>
      {Array.from({ length: 9 }, (_, i) => (
        <Cyl
          key={i}
          r={[0.05 + rand(i) * 0.03, 0.035 + rand(i + 4) * 0.02]}
          h={0.09 + rand(i + 8) * 0.14}
          p={[-1.3 + i * 0.42 + rand(i + 2) * 0.1, 1.8, -0.16]}
        >
          <Matte color={["#e6dfd2", "#b7ab97", "#7a6a55", "#3d3a36"][i % 4]} roughness={0.6} />
        </Cyl>
      ))}
    </group>
  );
}

// ============================================================================
// Office
// ============================================================================
export function Desk() {
  return (
    <group>
      <Box s={[1.9, 0.045, 0.85]} p={[0, 0.74, 0]} r={0.015}>
        <Wood color={OAK} />
      </Box>
      <Box s={[0.5, 0.56, 0.7]} p={[0.62, 0.44, 0]} r={0.012}>
        <Wood color="#7a5a3f" />
      </Box>
      <Box s={[0.05, 0.72, 0.7]} p={[-0.86, 0.36, 0]} r={0.012}>
        <Wood color={OAK} />
      </Box>
      {/* laptop */}
      <Box s={[0.36, 0.014, 0.25]} p={[-0.1, 0.77, 0.02]} r={0.004}>
        <Matte color="#8c8a86" roughness={0.35} />
      </Box>
      <Box s={[0.36, 0.24, 0.01]} p={[-0.1, 0.885, 0.19]} rot={[0.25, 0, 0]} r={0.004}>
        <Matte color="#2a2826" roughness={0.3} />
      </Box>
      <Box s={[0.3, 0.03, 0.22]} p={[0.55, 0.778, 0.1]} rot={[0, 0.25, 0]} r={0.004}>
        <Matte color="#3f463c" />
      </Box>
      <group position={[-0.7, 0.762, 0.2]}>
        <TableLamp />
      </group>
    </group>
  );
}

export function TaskChair({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((k) => (
        <Box
          key={k}
          s={[0.3, 0.025, 0.04]}
          p={[0, 0.05, 0]}
          rot={[0, (k / 5) * Math.PI * 2, 0]}
          r={0.008}
        >
          <Brass />
        </Box>
      ))}
      <Cyl r={0.025} h={0.4} p={[0, 0.25, 0]}>
        <Brass />
      </Cyl>
      <Box s={[0.5, 0.08, 0.48]} p={[0, 0.48, 0]} r={0.035}>
        <Fabric color={color} />
      </Box>
      <Box s={[0.46, 0.46, 0.06]} p={[0, 0.82, -0.23]} rot={[-0.1, 0, 0]} r={0.028}>
        <Fabric color={color} />
      </Box>
    </group>
  );
}
