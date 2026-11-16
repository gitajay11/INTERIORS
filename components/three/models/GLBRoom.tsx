"use client";

/**
 * Loads a GLB room instead of the procedural one.
 *
 * Naming convention inside the GLB (see README → "Adding 3D models & materials"):
 *   - meshes whose name starts with "wall"  → recoloured with the chosen paint
 *   - nodes named after a furniture slot (sofa, table, chairs, rug, lamps,
 *     shelves, decor)                        → shown / hidden by the toggles
 * Draco and Meshopt compressed files are both supported.
 */
import { useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SLOT_IDS, type DesignConfig, type SlotId } from "../catalog";

interface GLBRoomProps {
  url: string;
  config: DesignConfig;
  showFurniture: boolean;
}

export function GLBRoom({ url, config, showFurniture }: GLBRoomProps) {
  const { scene } = useGLTF(url, true, true);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    scene.traverse((node) => {
      const name = node.name.toLowerCase();
      const mesh = node as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = !name.startsWith("wall") && !name.startsWith("floor");
        mesh.receiveShadow = true;
        if (name.startsWith("wall")) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color?.set(config.wall);
        }
      }
      const slot = SLOT_IDS.find((id) => name === id || name.startsWith(`${id}_`));
      if (slot) {
        node.visible = showFurniture && !config.empty && config.furniture[slot as SlotId].visible;
      }
    });
    invalidate();
  }, [scene, config, showFurniture, invalidate]);

  return <primitive object={scene} />;
}
