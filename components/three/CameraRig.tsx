"use client";

/**
 * Camera behaviour for <RoomViewer />.
 *
 * - "orbit": user-driven camera-controls (rotate / zoom / pan with limits) plus
 *   animated transitions to preset viewpoints.
 * - "showcase": no user input. A slow back-and-forth orbit with mouse parallax,
 *   used by the home page hero so the page still scrolls normally.
 */
import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls, type CameraControlsImpl } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_LIMITS, CAMERA_PRESETS, type PresetId } from "./catalog";

export interface CameraCommand {
  preset: PresetId;
  nonce: number;
}

interface OrbitRigProps {
  controlsRef: RefObject<CameraControlsImpl | null>;
  initialPreset: PresetId;
  /** Exact starting view; overrides `initialPreset`. */
  initialView?: { position: [number, number, number]; target: [number, number, number] };
  /** Commands from the viewer's own buttons / shortcuts. */
  internal: CameraCommand;
  /** Commands from outside (e.g. the configurator store). */
  external?: CameraCommand;
  enabled: boolean;
  reducedMotion: boolean;
}

export function OrbitRig({
  controlsRef,
  initialPreset,
  initialView,
  internal,
  external,
  enabled,
  reducedMotion,
}: OrbitRigProps) {
  const invalidate = useThree((s) => s.invalidate);

  const goTo = (preset: PresetId, animate: boolean) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { position, target } = CAMERA_PRESETS[preset];
    void controls.setLookAt(...position, ...target, animate && !reducedMotion);
    invalidate();
  };

  // Initial placement + pan bounds (the orbit target must stay inside the room).
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { min, max } = CAMERA_LIMITS.targetBounds;
    controls.setBoundary(new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)));
    if (initialView) {
      void controls.setLookAt(...initialView.position, ...initialView.target, false);
      invalidate();
    } else {
      goTo(initialPreset, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const firstInternal = useRef(true);
  useEffect(() => {
    if (firstInternal.current) {
      firstInternal.current = false;
      return;
    }
    goTo(internal.preset, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce is the trigger
  }, [internal.nonce]);

  const lastExternal = useRef(external?.nonce);
  useEffect(() => {
    if (!external || external.nonce === lastExternal.current) return;
    lastExternal.current = external.nonce;
    goTo(external.preset, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nonce is the trigger
  }, [external?.nonce]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={enabled}
      minDistance={CAMERA_LIMITS.minDistance}
      maxDistance={CAMERA_LIMITS.maxDistance}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2 - 0.04}
      smoothTime={0.35}
      draggingSmoothTime={0.14}
      dollyToCursor={false}
    />
  );
}

interface ShowcaseRigProps {
  /** Disable the idle orbit (reduced motion); the camera then stays put. */
  animate: boolean;
  parallax: boolean;
}

const SHOWCASE_TARGET = new THREE.Vector3(0, 1.05, -0.7);

export function ShowcaseRig({ animate, parallax }: ShowcaseRigProps) {
  const pointer = useRef({ x: 0, y: 0 });
  const desired = useRef(new THREE.Vector3());
  const started = useRef(false);
  // The orbit is timed from the first rendered frame, not from canvas creation:
  // shader compilation can take seconds, and the scene must appear in the same
  // pose as the still image it fades in over.
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!parallax) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [parallax]);

  useFrame(({ camera, clock }, delta) => {
    if (startTime.current === null) startTime.current = clock.elapsedTime;
    const t = animate ? clock.elapsedTime - startTime.current : 0;
    // Sweep ±24° around a three-quarter view instead of a full turn, so the
    // window light always stays in frame.
    const angle = 0.5 + Math.sin(t * 0.11) * 0.42;
    const radius = 7.4;
    desired.current.set(
      Math.sin(angle) * radius + pointer.current.x * 0.55,
      2.15 - pointer.current.y * 0.3,
      Math.cos(angle) * radius - 0.7,
    );
    if (!started.current) {
      camera.position.copy(desired.current);
      started.current = true;
    } else {
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 2.2));
    }
    camera.lookAt(SHOWCASE_TARGET);
  });

  return null;
}
