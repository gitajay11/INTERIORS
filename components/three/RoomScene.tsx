"use client";

/**
 * Everything inside the canvas except the camera: lighting, the room shell and
 * the furniture layout for the requested room type.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { ROOM, type DesignConfig, type LayoutId, type SlotId } from "./catalog";
import { Room } from "./models/Room";
import {
  Armchair,
  Bed,
  Bench,
  CoffeeTable,
  Credenza,
  Desk,
  DiningChair,
  DiningTable,
  FloorLamp,
  Kitchen,
  Nightstand,
  OpenShelf,
  Pendant,
  Plant,
  Rug,
  Sofa,
  TaskChair,
  WallArt,
} from "./models/furniture";

type Vec3 = [number, number, number];

export interface LightTuning {
  sun: number;
  ambient: number;
  environment: number;
}
export const DEFAULT_LIGHTING: LightTuning = { sun: 5.5, ambient: 0.36, environment: 0.85 };

// ============================================================================
// Fade transition for furniture swaps and visibility toggles
// ============================================================================
interface FadeSwapProps {
  variant: string;
  visible: boolean;
  position?: Vec3;
  rotation?: Vec3;
  children: (variant: string) => ReactNode;
}

/**
 * Fades its children out, swaps to the new variant, then fades back in.
 * Also used for show/hide, so toggling an item never pops.
 */
function FadeSwap({ variant, visible, position, rotation, children }: FadeSwapProps) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const [shown, setShown] = useState(variant);
  const opacity = useRef(visible ? 1 : 0);
  const applied = useRef(-1);

  useEffect(() => invalidate(), [variant, visible, invalidate]);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    const target = visible && shown === variant ? 1 : 0;
    if (opacity.current !== target) {
      const step = Math.min(delta, 0.05) / 0.22;
      opacity.current =
        target > opacity.current
          ? Math.min(1, opacity.current + step)
          : Math.max(0, opacity.current - step);
      invalidate();
    }
    if (opacity.current === 0 && shown !== variant) {
      setShown(variant);
      applied.current = -1; // new children need their materials initialised
    }
    if (applied.current === opacity.current) return;
    applied.current = opacity.current;

    const o = opacity.current;
    node.visible = o > 0.001;
    node.scale.setScalar(0.97 + 0.03 * o);
    node.traverse((child) => {
      const material = (child as THREE.Mesh).material as THREE.Material | undefined;
      if (!material || Array.isArray(material)) return;
      const base = (material.userData.baseOpacity ??= material.opacity) as number;
      material.transparent = o < 1 || base < 1;
      material.opacity = base * o;
      // Faded pieces must not punch holes in the shadow map.
      (child as THREE.Mesh).castShadow = o > 0.5 && child.userData.noShadow !== true;
    });
  });

  return (
    <group ref={group} position={position} rotation={rotation}>
      {children(shown)}
    </group>
  );
}

// ============================================================================
// Layouts
// ============================================================================
interface LayoutProps {
  config: DesignConfig;
  showFurniture: boolean;
}

const BACK = -ROOM.depth / 2;
const RIGHT = ROOM.width / 2;
const FACE_LEFT: Vec3 = [0, -Math.PI / 2, 0]; // piece against the right wall, facing into the room

function useSlots({ config, showFurniture }: LayoutProps) {
  return (slot: SlotId) => ({
    variant: config.furniture[slot].variant,
    visible: showFurniture && !config.empty && config.furniture[slot].visible,
  });
}

function LivingLayout(props: LayoutProps) {
  const slot = useSlots(props);
  const fabric = props.config.fabric;
  return (
    <>
      <FadeSwap {...slot("rug")} position={[0, 0, -0.35]}>
        {(v) => <Rug variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("sofa")} position={[0, 0, -1.9]}>
        {(v) => <Sofa variant={v} color={fabric} />}
      </FadeSwap>
      <FadeSwap {...slot("table")} position={[0, 0, -0.4]}>
        {(v) => <CoffeeTable variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("chairs")}>
        {(v) => (
          <>
            <group position={[-2.2, 0, -0.1]} rotation={[0, Math.PI / 2 - 0.35, 0]}>
              <Armchair variant={v} color={fabric} />
            </group>
            <group position={[2.2, 0, 0.05]} rotation={[0, -Math.PI / 2 + 0.35, 0]}>
              <Armchair variant={v} color={fabric} />
            </group>
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("lamps")} position={[2.5, 0, BACK + 0.5]} rotation={[0, 0.5, 0]}>
        {(v) => <FloorLamp variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("shelves")} position={[RIGHT - 0.24, 0, -1.45]} rotation={FACE_LEFT}>
        {(v) => (v === "credenza" ? <Credenza /> : <OpenShelf seed={3} />)}
      </FadeSwap>
      <FadeSwap {...slot("decor")}>
        {(v) => (
          <>
            <group position={[-2.85, 0, BACK + 0.55]}>
              <Plant variant={v} />
            </group>
            <group position={[0, 1.75, BACK + 0.02]}>
              <WallArt variant={v} />
            </group>
          </>
        )}
      </FadeSwap>
    </>
  );
}

function BedroomLayout(props: LayoutProps) {
  const slot = useSlots(props);
  const fabric = props.config.fabric;
  return (
    <>
      <FadeSwap {...slot("rug")} position={[0, 0, -0.7]}>
        {(v) => <Rug variant={v} size={[3.6, 2.6]} />}
      </FadeSwap>
      <FadeSwap {...slot("sofa")} position={[0, 0, BACK + 1.16]}>
        {() => (
          <>
            <Bed color={fabric} />
            <group position={[-1.35, 0, -0.85]}>
              <Nightstand />
            </group>
            <group position={[1.35, 0, -0.85]}>
              <Nightstand />
            </group>
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("table")} position={[0, 0, -0.18]}>
        {() => <Bench color={fabric} />}
      </FadeSwap>
      <FadeSwap {...slot("chairs")} position={[2.35, 0, 1.3]} rotation={[0, -Math.PI / 2 + 0.6, 0]}>
        {(v) => <Armchair variant={v} color={fabric} />}
      </FadeSwap>
      <FadeSwap {...slot("lamps")} position={[3.05, 0, 0.55]} rotation={[0, -0.6, 0]}>
        {(v) => <FloorLamp variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("shelves")} position={[RIGHT - 0.27, 0, -1.4]} rotation={FACE_LEFT}>
        {() => <Credenza width={1.7} lamp={false} />}
      </FadeSwap>
      <FadeSwap {...slot("decor")}>
        {(v) => (
          <>
            <group position={[-2.85, 0, 1.9]}>
              <Plant variant={v} />
            </group>
            <group position={[0, 2.05, BACK + 0.02]} scale={0.85}>
              <WallArt variant={v} />
            </group>
          </>
        )}
      </FadeSwap>
    </>
  );
}

function DiningLayout(props: LayoutProps) {
  const slot = useSlots(props);
  const fabric = props.config.fabric;
  const tableZ = 0.55;
  return (
    <>
      <FadeSwap {...slot("rug")} position={[0, 0, tableZ]}>
        {(v) => <Rug variant={v} size={[3.5, 2.5]} />}
      </FadeSwap>
      <FadeSwap {...slot("shelves")} position={[0, 0, BACK + 0.32]}>
        {() => <Kitchen />}
      </FadeSwap>
      <FadeSwap {...slot("table")} position={[0, 0, tableZ]}>
        {(v) => <DiningTable variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("chairs")} position={[0, 0, tableZ]}>
        {() => (
          <>
            {[-0.72, 0, 0.72].map((x) => (
              <group key={x}>
                <group position={[x, 0, -0.68]}>
                  <DiningChair color={fabric} />
                </group>
                <group position={[x, 0, 0.68]} rotation={[0, Math.PI, 0]}>
                  <DiningChair color={fabric} />
                </group>
              </group>
            ))}
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("lamps")} position={[0, ROOM.height, tableZ]}>
        {() => (
          <>
            {[-0.7, 0, 0.7].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <Pendant drop={1.15} />
              </group>
            ))}
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("sofa")} position={[RIGHT - 0.27, 0, 0.9]} rotation={FACE_LEFT}>
        {() => <Credenza width={1.8} />}
      </FadeSwap>
      <FadeSwap {...slot("decor")}>
        {(v) => (
          <>
            <group position={[-2.85, 0, 2.1]}>
              <Plant variant={v} />
            </group>
            <group position={[RIGHT - 0.02, 1.7, 0.9]} rotation={FACE_LEFT} scale={0.8}>
              <WallArt variant={v} />
            </group>
          </>
        )}
      </FadeSwap>
    </>
  );
}

function OfficeLayout(props: LayoutProps) {
  const slot = useSlots(props);
  const fabric = props.config.fabric;
  return (
    <>
      <FadeSwap {...slot("rug")} position={[0, 0, -0.9]}>
        {(v) => <Rug variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("shelves")} position={[0, 0, BACK + 0.2]}>
        {() => (
          <>
            {[-1.55, 0, 1.55].map((x, i) => (
              <group key={x} position={[x, 0, 0]}>
                <OpenShelf seed={i + 5} width={1.5} height={2.3} />
              </group>
            ))}
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("table")} position={[0, 0, -0.75]}>
        {() => <Desk />}
      </FadeSwap>
      <FadeSwap {...slot("sofa")} position={[0, 0, -1.5]}>
        {() => <TaskChair color={fabric} />}
      </FadeSwap>
      <FadeSwap {...slot("chairs")}>
        {(v) => (
          <>
            <group position={[-0.6, 0, 0.75]} rotation={[0, Math.PI - 0.25, 0]}>
              <Armchair variant={v} color={fabric} />
            </group>
            <group position={[0.6, 0, 0.75]} rotation={[0, Math.PI + 0.25, 0]}>
              <Armchair variant={v} color={fabric} />
            </group>
          </>
        )}
      </FadeSwap>
      <FadeSwap {...slot("lamps")} position={[3.0, 0, 0.4]} rotation={[0, -0.5, 0]}>
        {(v) => <FloorLamp variant={v} />}
      </FadeSwap>
      <FadeSwap {...slot("decor")}>
        {(v) => (
          <>
            <group position={[-2.9, 0, 2.0]}>
              <Plant variant={v} />
            </group>
            <group position={[RIGHT - 0.02, 1.7, -0.7]} rotation={FACE_LEFT} scale={0.85}>
              <WallArt variant={v} />
            </group>
          </>
        )}
      </FadeSwap>
    </>
  );
}

const LAYOUTS: Record<LayoutId, (props: LayoutProps) => ReactNode> = {
  living: LivingLayout,
  bedroom: BedroomLayout,
  dining: DiningLayout,
  office: OfficeLayout,
};

/** The furniture arrangement for one room type, on its own (no shell, no lights). */
export function RoomFurniture({
  layout,
  config,
  showFurniture = true,
}: {
  layout: LayoutId;
  config: DesignConfig;
  showFurniture?: boolean;
}) {
  const Layout = LAYOUTS[layout];
  return <Layout config={config} showFurniture={showFurniture} />;
}

// ============================================================================
// Lighting
// ============================================================================
export function Lighting({
  tuning = DEFAULT_LIGHTING,
  shadows,
}: {
  tuning?: LightTuning;
  shadows: boolean;
}) {
  return (
    <>
      <ambientLight intensity={tuning.ambient} color="#fff6e8" />
      {/* Low afternoon sun entering through the window on the left wall. */}
      <directionalLight
        position={[-8, 5, 1.6]}
        intensity={tuning.sun}
        color="#fff0d9"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-radius={5}
      >
        <orthographicCamera attach="shadow-camera" args={[-6.5, 6.5, 6, -6, 1, 24]} />
      </directionalLight>
      {/* Soft fill from the viewer side so forms read in the shaded part of the room. */}
      <directionalLight position={[4, 6, 7]} intensity={tuning.sun * 0.14} color="#f3f1ff" />
      {/* Procedural image-based lighting: no HDRI download required. */}
      <Environment resolution={128} frames={1} environmentIntensity={tuning.environment}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#8d857a" side={THREE.BackSide} />
        </mesh>
        <Lightformer
          form="rect"
          intensity={5}
          color="#fff3df"
          position={[-9, 4, 0]}
          rotation-y={Math.PI / 2}
          scale={[9, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#ffffff"
          position={[0, 9, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#e9eef2"
          position={[9, 3, 4]}
          rotation-y={-Math.PI / 2}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#ffe9cf"
          position={[0, 3, 10]}
          rotation-y={Math.PI}
          scale={[12, 6, 1]}
        />
      </Environment>
    </>
  );
}

// ============================================================================
// Scene
// ============================================================================
export interface RoomSceneProps {
  config: DesignConfig;
  layout?: LayoutId;
  showFurniture?: boolean;
  shadows?: boolean;
  lowQuality?: boolean;
  tuning?: LightTuning;
  /** Lighting only: a GLB supplies the room and furniture. */
  hideProcedural?: boolean;
}

export function RoomScene({
  config,
  layout = "living",
  showFurniture = true,
  shadows = true,
  lowQuality = false,
  tuning,
  hideProcedural = false,
}: RoomSceneProps) {
  const Layout = LAYOUTS[layout];
  return (
    <>
      <Lighting tuning={tuning} shadows={shadows} />
      {!hideProcedural && (
        <>
          <Room wallColor={config.wall} floor={config.floor} lowQuality={lowQuality} />
          <Layout config={config} showFurniture={showFurniture} />
          {/* Soft contact shadows ground the furniture in the shaded part of the room.
              The plane sits just above the rugs so shadows fall on them too. */}
          {shadows && (
            <ContactShadows
              position={[0, 0.03, 0]}
              scale={[ROOM.width, ROOM.depth]}
              resolution={512}
              far={1.4}
              blur={2}
              opacity={0.8}
              color="#3b3026"
            />
          )}
        </>
      )}
    </>
  );
}
