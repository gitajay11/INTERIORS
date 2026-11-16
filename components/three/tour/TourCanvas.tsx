"use client";

/**
 * The WebGL half of the home page walkthrough: the house, its lighting and a
 * camera that follows the route in ./plan.ts as far as `progress` says.
 *
 * It renders on demand: a frame is drawn only while the camera is still
 * catching up with the scroll position or the pointer is moving.
 */
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { House } from "./House";
import "../quiet";
import { pendingSurfaceLoads } from "../textures";
import { HOUSE, KEYFRAMES, TOUR_WAKE, tourMark, wrapAngle, type LookState } from "./plan";

tourMark("module-loaded");

const SKY = "#dce7ec"; // horizon haze; the fog fades the lawn into it
const ZENITH = "#8fb4cf";

export interface TourCanvasProps {
  /** Position along the camera curve, 0–1. Read every frame; never causes a React render. */
  progress: RefObject<number>;
  quality: "high" | "low";
  /** Stop rendering entirely (the tour is off screen). */
  paused?: boolean;
  /** Where the visitor has turned to look. Read every frame. Omit for a camera that only follows the route. */
  look?: RefObject<LookState>;
  onReady?: () => void;
  /** Called once if frames average under 26 fps, so the host can lower the quality. */
  onSlow?: () => void;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
/** Horizontal field of view to aim for; the vertical one follows from the aspect ratio. */
const H_FOV = 80;

function TourRig({ progress, look }: { progress: RefObject<number>; look?: RefObject<LookState> }) {
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);

  const { path, focus } = useMemo(
    () => ({
      // Centripetal splines do not overshoot, which keeps the camera out of door frames.
      path: new THREE.CatmullRomCurve3(
        KEYFRAMES.map((k) => new THREE.Vector3(...k.position)),
        false,
        "centripetal",
      ),
      focus: new THREE.CatmullRomCurve3(
        KEYFRAMES.map((k) => new THREE.Vector3(...k.look)),
        false,
        "centripetal",
      ),
    }),
    [],
  );

  const current = useRef(-1);
  /** The look offset actually applied; it eases towards what the visitor asked for. */
  const shown = useRef({ yaw: 0, pitch: 0 });
  // Scratch vectors, reused every frame.
  const scratch = useRef({
    point: new THREE.Vector3(),
    target: new THREE.Vector3(),
    forward: new THREE.Vector3(),
  });
  const aspect = useRef(0);

  // A resize changes the field of view (see below), so draw a fresh frame.
  useEffect(() => invalidate(), [size, invalidate]);

  // Rendering is on demand: scrolling and looking around both ask for frames.
  useEffect(() => {
    const wake = () => invalidate();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener(TOUR_WAKE, wake);
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener(TOUR_WAKE, wake);
    };
  }, [invalidate]);

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const { point, target, forward } = scratch.current;

    // Narrow (portrait) screens get a taller field of view so rooms still read.
    const nextAspect = state.size.width / Math.max(1, state.size.height);
    if (nextAspect !== aspect.current) {
      aspect.current = nextAspect;
      const vertical = THREE.MathUtils.radToDeg(
        2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(H_FOV / 2)) / nextAspect),
      );
      camera.fov = THREE.MathUtils.clamp(vertical, 46, 78);
      camera.updateProjectionMatrix();
    }

    const goal = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);
    const dt = Math.min(delta, 0.1);
    // The first frame starts exactly where the page is scrolled to.
    current.current =
      current.current < 0 ? goal : THREE.MathUtils.damp(current.current, goal, 4.5, dt);

    path.getPoint(current.current, point);
    focus.getPoint(current.current, target);
    camera.position.copy(point);

    // Looking around: turn away from the route's direction by the visitor's
    // yaw and pitch. A drag is followed tightly; letting go, or walking on,
    // eases the view (the short way round) to wherever it should now point.
    const wanted = look?.current;
    const ease = 1 - Math.exp(-(wanted?.dragging ? 18 : 3.2) * dt);
    const yawGap = wrapAngle((wanted?.yaw ?? 0) - shown.current.yaw);
    const pitchGap = (wanted?.pitch ?? 0) - shown.current.pitch;
    shown.current.yaw += yawGap * ease;
    shown.current.pitch += pitchGap * ease;

    forward.subVectors(target, point).normalize();
    const heading = Math.atan2(forward.x, forward.z) + shown.current.yaw;
    const pitch = THREE.MathUtils.clamp(Math.asin(forward.y) + shown.current.pitch, -1.3, 1.3);
    target.set(
      point.x + Math.sin(heading) * Math.cos(pitch),
      point.y + Math.sin(pitch),
      point.z + Math.cos(heading) * Math.cos(pitch),
    );
    camera.lookAt(target);

    const settling =
      Math.abs(goal - current.current) > 0.00004 ||
      Math.abs(yawGap) > 0.0004 ||
      Math.abs(pitchGap) > 0.0004;
    if (settling) invalidate();
  });

  return null;
}

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------
/**
 * Afternoon sun from the south-west. Nothing in the house moves, so the shadow
 * map is rendered for the first few frames only and then reused.
 */
function Sun({ mapSize }: { mapSize: number }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const frames = useRef(0);
  const invalidate = useThree((state) => state.invalidate);

  const centerX = (HOUSE.minX + HOUSE.maxX) / 2;
  const target = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.set(centerX, 0, 1.2);
    return object;
  }, [centerX]);
  const position = useMemo(
    () => new THREE.Vector3(-0.52, 0.76, 0.6).normalize().multiplyScalar(45).add(target.position),
    [target],
  );

  useFrame(() => {
    const shadow = light.current?.shadow;
    if (!shadow) return;
    shadow.autoUpdate = false;
    // Materials and furniture settle over the first frames; bake until they have.
    if (frames.current < 14) {
      frames.current += 1;
      shadow.needsUpdate = true;
      invalidate();
    }
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={light}
        target={target}
        position={position}
        intensity={5.2}
        color="#fff0d9"
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-21, 21, 13, -13, 1, 95]} />
      </directionalLight>
    </>
  );
}

function Lighting({ mapSize }: { mapSize: number }) {
  return (
    <>
      <ambientLight intensity={0.5} color="#fff6e8" />
      <hemisphereLight args={["#fdf8ee", "#b9a98f", 0.35]} />
      <Sun mapSize={mapSize} />
      {/* Procedural image-based lighting: no HDRI download required. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.9}>
        <mesh scale={50}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#8d857a" side={THREE.BackSide} />
        </mesh>
        <Lightformer
          form="rect"
          intensity={4}
          color="#fff3df"
          position={[-9, 4, 4]}
          rotation-y={Math.PI / 2}
          scale={[9, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#ffffff"
          position={[0, 9, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#e9eef2"
          position={[9, 3, 4]}
          rotation-y={-Math.PI / 2}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff0dc"
          position={[0, 3, 10]}
          rotation-y={Math.PI}
          scale={[12, 6, 1]}
        />
      </Environment>
    </>
  );
}

/** A soft sky gradient on a dome, so the garden view is not a flat colour. */
function Sky() {
  const texture = useMemo(() => {
    const rows = 64;
    const data = new Uint8Array(rows * 4);
    const low = new THREE.Color(SKY);
    const high = new THREE.Color(ZENITH);
    const mixed = new THREE.Color();
    for (let i = 0; i < rows; i++) {
      // The lower half of the dome is below the horizon and stays haze-coloured.
      const t = THREE.MathUtils.smoothstep(i / (rows - 1), 0.5, 0.72);
      mixed.copy(low).lerp(high, t).convertLinearToSRGB();
      data.set([mixed.r * 255, mixed.g * 255, mixed.b * 255, 255], i * 4);
    }
    const gradient = new THREE.DataTexture(data, 1, rows, THREE.RGBAFormat);
    gradient.colorSpace = THREE.SRGBColorSpace;
    gradient.magFilter = THREE.LinearFilter;
    gradient.minFilter = THREE.LinearFilter;
    gradient.needsUpdate = true;
    return gradient;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh scale={130}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Housekeeping
// ---------------------------------------------------------------------------
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  useFrame(() => {
    // Wait for the baked shadows before revealing the canvas.
    if (done.current) return;
    frames.current += 1;
    if (frames.current === 1) tourMark("first-frame-start");
    if (frames.current === 2) tourMark("first-frame-drawn");
    // Ready once the shadows are baked and the worker has delivered every texture.
    if (frames.current >= 16 && pendingSurfaceLoads() === 0) {
      done.current = true;
      tourMark("ready");
      onReady?.();
    } else invalidate();
  });
  return null;
}

/** Averages runs of consecutive frames (idle gaps are not slow frames). */
function SlowFrameWatch({ onSlow }: { onSlow?: () => void }) {
  const samples = useRef<number[]>([]);
  const fired = useRef(false);
  useFrame((_, delta) => {
    if (fired.current || !onSlow) return;
    if (delta > 0.2) {
      samples.current = [];
      return;
    }
    samples.current.push(delta);
    if (samples.current.length < 50) return;
    const average = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length;
    samples.current = [];
    if (average > 1 / 26) {
      fired.current = true;
      onSlow();
    }
  });
  return null;
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------
export default function TourCanvas({
  progress,
  quality,
  paused = false,
  look,
  onReady,
  onSlow,
}: TourCanvasProps) {
  const high = quality === "high";
  const start = KEYFRAMES[0];
  return (
    <Canvas
      shadows="percentage"
      dpr={high ? [1, 1.75] : [1, 1.25]}
      onCreated={({ gl }) => {
        // Stock materials only: skip the per-program compile readback (see RoomViewer).
        gl.debug.checkShaderErrors = false;
      }}
      frameloop={paused ? "never" : "demand"}
      camera={{ fov: 54, near: 0.08, far: 150, position: start.position }}
      gl={{ antialias: !high, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 34, 110]} />
      <Suspense fallback={null}>
        <Sky />
        <Lighting mapSize={high ? 4096 : 2048} />
        <House lowQuality={!high} />
        <ReadySignal onReady={onReady} />
      </Suspense>
      <TourRig progress={progress} look={look} />
      <SlowFrameWatch onSlow={onSlow} />
      {high && (
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.9} distanceFalloff={1} intensity={2.2} quality="medium" />
          <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.3} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
