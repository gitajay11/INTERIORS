"use client";

/** Slowly rotating sphere that previews a material with full PBR shading. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import type { SurfaceSpec } from "@/lib/surfaces";
import { getSurfaceTextures } from "./textures";
import "./quiet";

function Sphere({ surface, spin }: { surface: SurfaceSpec; spin: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const textures = useMemo(() => {
    // A dedicated size keeps these textures separate from the floor's (which
    // uses a different repeat on the shared, cached texture objects).
    const set = getSurfaceTextures(surface, 384);
    for (const texture of Object.values(set)) texture.repeat.set(3, 1.5);
    return set;
  }, [surface]);

  useFrame((_, delta) => {
    if (spin && mesh.current) mesh.current.rotation.y += delta * 0.35;
  });

  return (
    <mesh ref={mesh} rotation={[0.25, 0, 0]}>
      <sphereGeometry args={[1, 96, 64]} />
      <meshStandardMaterial
        key={JSON.stringify(surface)}
        map={textures.map}
        normalMap={textures.normalMap}
        roughnessMap={textures.roughnessMap}
        roughness={1}
        metalness={surface.metalness ?? 0}
      />
    </mesh>
  );
}

export default function MaterialSphere({
  surface,
  label,
}: {
  surface: SurfaceSpec;
  label: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  return (
    <div
      className="bg-muted aspect-square w-full overflow-hidden rounded-sm"
      role="img"
      aria-label={label}
    >
      <Canvas
        dpr={[1, 2]}
        frameloop={reduced ? "demand" : "always"}
        camera={{ fov: 30, position: [0, 0, 4.6] }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={2.4} color="#fff3e2" />
        <Environment resolution={128} frames={1}>
          <mesh scale={40}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#8d857a" side={THREE.BackSide} />
          </mesh>
          <Lightformer
            form="rect"
            intensity={5}
            position={[-6, 3, 4]}
            scale={[6, 6, 1]}
            color="#fff3df"
          />
          <Lightformer
            form="rect"
            intensity={2}
            position={[6, 2, -2]}
            rotation-y={-Math.PI / 2}
            scale={[6, 4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[0, 7, 0]}
            rotation-x={Math.PI / 2}
            scale={[8, 8, 1]}
          />
        </Environment>
        <Sphere surface={surface} spin={!reduced} />
      </Canvas>
    </div>
  );
}
