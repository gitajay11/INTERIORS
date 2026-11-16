"use client";

/**
 * <RoomViewer /> — the reusable 3D room component behind the home hero, the
 * project pages and the 3D Design Studio.
 *
 * Features (all configurable through props):
 *  - orbit / zoom / pan with clamped distance and pan bounds
 *  - preset viewpoints with animated transitions, reset camera
 *  - toggle furniture visibility
 *  - keyboard shortcuts (R, F, 1–4, arrows, +/-), touch gestures, on-screen hints
 *  - adaptive quality (PerformanceMonitor + AdaptiveDpr), WebGL fallback image,
 *    loading overlay, error boundary
 *
 * Import it through `LazyRoomViewer` so the three.js bundle is only downloaded
 * when a viewer is about to scroll into view.
 */
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
  type Ref,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  AdaptiveDpr,
  PerformanceMonitor,
  useProgress,
  type CameraControlsImpl,
} from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import {
  CAMERA_PRESETS,
  DEFAULT_CONFIG,
  DEFAULT_PRESET,
  PRESET_IDS,
  type DesignConfig,
  type LayoutId,
  type PresetId,
} from "./catalog";
import { OrbitRig, ShowcaseRig, type CameraCommand } from "./CameraRig";
import { RoomScene, type LightTuning } from "./RoomScene";
import { GLBRoom } from "./models/GLBRoom";
import { cn } from "@/lib/utils";
import "./quiet";

// Leva is only ever bundled in development.
const LightTuner =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./dev/LightTuner"), { ssr: false })
    : null;

export interface RoomViewerHandle {
  goToPreset: (preset: PresetId) => void;
  resetCamera: () => void;
  /** PNG data URL of the current frame (requires `preserveDrawingBuffer`). */
  screenshot: () => string | null;
}

export interface RoomViewerProps {
  /** Design to render. Defaults to the studio's default living room. */
  config?: DesignConfig;
  layout?: LayoutId;
  /** Optional GLB to render instead of the procedural room. */
  modelUrl?: string;
  /** "orbit" = user controlled, "showcase" = slow automatic camera (hero). */
  mode?: "orbit" | "showcase";
  initialPreset?: PresetId;
  /** Exact starting camera; overrides `initialPreset`. */
  initialView?: { position: [number, number, number]; target: [number, number, number] };
  /** External camera commands, e.g. from the configurator store. */
  cameraCommand?: CameraCommand;
  /** Controlled furniture visibility. Omit to let the viewer manage it. */
  furnitureVisible?: boolean;
  onFurnitureToggle?: () => void;
  /** Called when the user asks for a camera reset (R key / button) in controlled setups. */
  onResetCamera?: () => void;
  /** On-screen preset / reset / furniture buttons. */
  showControls?: boolean;
  showHints?: boolean;
  /** "global": shortcuts work anywhere on the page. "focus": only while hovered/focused. */
  shortcuts?: "global" | "focus" | false;
  /** Require a click before the viewer captures scroll and drag (for long pages). */
  requireActivation?: boolean;
  /** Needed for PNG export. */
  preserveDrawingBuffer?: boolean;
  /** Shown when WebGL is unavailable or the scene fails. */
  fallbackImage?: string;
  /** "auto" adapts to the device; "high"/"low" pin the quality tier. */
  quality?: "auto" | "high" | "low";
  /** Scene background colour. */
  background?: string;
  /** Mouse parallax in showcase mode. */
  parallax?: boolean;
  className?: string;
  label?: string;
  handleRef?: Ref<RoomViewerHandle>;
  onReady?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Stops three.js reading back the compile status of every shader program. The
 * scene uses only stock materials, so the checks find nothing; they do block
 * the main thread during the first frames and surface harmless driver warnings.
 * Remove this when debugging a custom shader.
 */
export function disableShaderChecks({ gl }: { gl: { debug: { checkShaderErrors: boolean } } }) {
  gl.debug.checkShaderErrors = false;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("RoomViewer failed to render", error, info.componentStack);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Fires once after the first frame has actually been drawn. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady();
  });
  return null;
}

/**
 * Frame-rate watchdog for `frameloop="demand"`. Idle gaps between renders are
 * not slow frames, so only runs of consecutive frames (during orbiting or a
 * transition) are measured. Calls `onDecline` once if they average under 26 fps.
 */
function DemandMonitor({ onDecline }: { onDecline: () => void }) {
  const samples = useRef<number[]>([]);
  const declined = useRef(false);
  useFrame((_, delta) => {
    if (declined.current) return;
    if (delta > 0.2) {
      samples.current = [];
      return;
    }
    samples.current.push(delta);
    if (samples.current.length < 45) return;
    const average = samples.current.reduce((sum, value) => sum + value, 0) / samples.current.length;
    samples.current = [];
    if (average > 1 / 26) {
      declined.current = true;
      onDecline();
    }
  });
  return null;
}

function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={1.1} distanceFalloff={1} intensity={2.4} quality="medium" />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.3} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}

function Fallback({ image, message }: { image?: string; message: string }) {
  return (
    <div className="bg-muted absolute inset-0 flex items-end justify-start">
      {image && <Image src={image} alt="" fill sizes="100vw" className="object-cover" />}
      <p className="bg-surface/90 text-fg-muted relative m-4 rounded-sm px-3 py-2 text-xs backdrop-blur">
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RoomViewer({
  config = DEFAULT_CONFIG,
  layout = "living",
  modelUrl,
  mode = "orbit",
  initialPreset = DEFAULT_PRESET,
  initialView,
  cameraCommand,
  furnitureVisible,
  onFurnitureToggle,
  onResetCamera,
  showControls = true,
  showHints = true,
  shortcuts = "focus",
  requireActivation = false,
  preserveDrawingBuffer = false,
  fallbackImage,
  quality = "auto",
  background = "#e9e3d8",
  parallax = true,
  className,
  label = "Interactive 3D room",
  handleRef,
  onReady,
}: RoomViewerProps) {
  const container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<CameraControlsImpl | null>(null);

  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [autoTier, setTier] = useState<"high" | "low">("high");
  const tier = quality === "auto" ? autoTier : quality;
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [active, setActive] = useState(!requireActivation);
  const [hovered, setHovered] = useState(false);
  const [internalFurniture, setInternalFurniture] = useState(true);
  const [command, setCommand] = useState<CameraCommand>({ preset: initialPreset, nonce: 0 });
  const [tuning, setTuning] = useState<LightTuning>();
  const [tune, setTune] = useState(false);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const coarsePointer = useMediaQuery("(pointer: coarse)");
  const { active: loading, progress } = useProgress();

  const showFurniture = furnitureVisible ?? internalFurniture;
  const orbit = mode === "orbit";

  useEffect(() => {
    setWebgl(detectWebGL());
    setTune(new URLSearchParams(window.location.search).has("tune"));
    // Start on the low tier for obviously constrained devices.
    const nav = navigator as Navigator & { deviceMemory?: number };
    if ((nav.deviceMemory && nav.deviceMemory <= 4) || nav.hardwareConcurrency <= 4) setTier("low");
  }, []);

  // Pause rendering entirely while the viewer is off screen.
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "100px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const goToPreset = useCallback((preset: PresetId) => {
    setCommand((current) => ({ preset, nonce: current.nonce + 1 }));
  }, []);
  const resetCamera = useCallback(() => {
    if (onResetCamera) onResetCamera();
    else goToPreset(initialPreset);
  }, [goToPreset, initialPreset, onResetCamera]);
  const toggleFurniture = useCallback(() => {
    if (onFurnitureToggle) onFurnitureToggle();
    else setInternalFurniture((value) => !value);
  }, [onFurnitureToggle]);

  useImperativeHandle(
    handleRef,
    () => ({
      goToPreset,
      resetCamera,
      screenshot: () => canvasRef.current?.toDataURL("image/png") ?? null,
    }),
    [goToPreset, resetCamera],
  );

  // Keyboard shortcuts.
  useEffect(() => {
    if (!orbit || !shortcuts) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      const focused = container.current?.contains(document.activeElement) ?? false;
      if (shortcuts === "focus" && !focused && !hovered) return;

      const key = event.key.toLowerCase();
      if (key === "r") resetCamera();
      else if (key === "f") toggleFurniture();
      else if (["1", "2", "3", "4"].includes(key)) goToPreset(PRESET_IDS[Number(key) - 1]);
      else if (focused && controlsRef.current) {
        // Arrow keys / +/- give keyboard-only users full camera control.
        const controls = controlsRef.current;
        const step = Math.PI / 12;
        if (key === "arrowleft") void controls.rotate(-step, 0, true);
        else if (key === "arrowright") void controls.rotate(step, 0, true);
        else if (key === "arrowup") void controls.rotate(0, -step / 2, true);
        else if (key === "arrowdown") void controls.rotate(0, step / 2, true);
        else if (key === "+" || key === "=") void controls.dolly(1, true);
        else if (key === "-") void controls.dolly(-1, true);
        else if (key === "escape" && requireActivation) setActive(false);
        else return;
        setActive(true);
      } else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orbit, shortcuts, hovered, resetCamera, toggleFurniture, goToPreset, requireActivation]);

  const handleReady = useCallback(() => {
    setReady(true);
    onReady?.();
  }, [onReady]);

  const fallback = (
    <Fallback
      image={fallbackImage}
      message="3D preview is unavailable on this device — showing a still image instead."
    />
  );

  const wantsContinuous = mode === "showcase" && !reducedMotion;
  const frameloop = !inView ? "never" : wantsContinuous ? "always" : "demand";

  return (
    <div
      ref={container}
      className={cn("bg-muted relative isolate overflow-hidden", className)}
      role={orbit ? "application" : "img"}
      aria-label={label}
      aria-describedby={orbit && showHints ? "room-viewer-hints" : undefined}
      tabIndex={orbit ? 0 : -1}
      // Stop Lenis from scrolling the page while the user zooms the room.
      {...(orbit && active ? { "data-lenis-prevent": "" } : {})}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => {
        setHovered(false);
        if (requireActivation) setActive(false);
      }}
      onContextMenu={(event) => orbit && event.preventDefault()}
    >
      {webgl === false && fallback}

      {webgl && (
        <SceneErrorBoundary fallback={fallback}>
          <Canvas
            ref={canvasRef}
            shadows={tier === "high" ? "percentage" : false}
            dpr={tier === "high" ? [1, 2] : [1, 1.25]}
            onCreated={disableShaderChecks}
            frameloop={frameloop}
            camera={{
              fov: 38,
              near: 0.1,
              far: 80,
              position: initialView?.position ?? CAMERA_PRESETS[initialPreset].position,
            }}
            gl={{ antialias: true, preserveDrawingBuffer, powerPreference: "high-performance" }}
            style={{ pointerEvents: orbit && active ? "auto" : "none", touchAction: "none" }}
          >
            <color attach="background" args={[background]} />
            {/* drei's monitor assumes a continuous loop; on-demand rendering needs its own. */}
            {frameloop === "always" ? (
              <PerformanceMonitor onDecline={() => setTier("low")} />
            ) : (
              <DemandMonitor onDecline={() => setTier("low")} />
            )}
            {/* Resolution scaling while moving, on the tier that needs it. (The effect
                composer on the high tier manages its own buffers.) */}
            {tier === "low" && <AdaptiveDpr pixelated />}
            <Suspense fallback={null}>
              {modelUrl ? (
                <GLBRoom url={modelUrl} config={config} showFurniture={showFurniture} />
              ) : null}
              <RoomScene
                config={config}
                layout={layout}
                showFurniture={showFurniture}
                shadows={tier === "high"}
                lowQuality={tier === "low"}
                tuning={tuning}
                hideProcedural={Boolean(modelUrl)}
              />
              <ReadySignal onReady={handleReady} />
            </Suspense>
            {orbit ? (
              <OrbitRig
                controlsRef={controlsRef}
                initialPreset={initialPreset}
                initialView={initialView}
                internal={command}
                external={cameraCommand}
                enabled={active}
                reducedMotion={reducedMotion}
              />
            ) : (
              <ShowcaseRig animate={!reducedMotion} parallax={parallax && !coarsePointer} />
            )}
            {tier === "high" && <Effects />}
          </Canvas>
        </SceneErrorBoundary>
      )}

      {/* Loading overlay */}
      {webgl !== false && (
        <div
          className={cn(
            "bg-muted pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 transition-opacity duration-700",
            ready && !loading ? "opacity-0" : "opacity-100",
          )}
          role="status"
          aria-live="polite"
          aria-hidden={ready && !loading}
        >
          <span className="font-serif text-2xl">Preparing the room</span>
          <div className="bg-border h-px w-40 overflow-hidden">
            <div
              className="bg-accent h-full transition-[width] duration-300"
              style={{ width: `${loading ? Math.max(progress, 8) : ready ? 100 : 35}%` }}
            />
          </div>
          <span className="text-fg-muted text-xs tabular-nums">
            {loading ? `${Math.round(progress)}%` : "Building geometry and materials"}
          </span>
        </div>
      )}

      {/* Click-to-activate veil for viewers embedded in long pages */}
      {orbit && requireActivation && !active && webgl && ready && (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10 focus-visible:bg-black/10"
        >
          <span className="bg-surface text-fg shadow-soft rounded-sm px-5 py-3 text-sm font-medium">
            Click to explore in 3D
          </span>
        </button>
      )}

      {/* On-screen controls */}
      {orbit && showControls && webgl && (
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
          <div
            className="bg-surface/90 shadow-soft flex rounded-sm p-1 backdrop-blur"
            role="group"
            aria-label="Camera viewpoints"
          >
            {PRESET_IDS.map((id, index) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActive(true);
                  goToPreset(id);
                }}
                className="hover:bg-muted min-h-9 rounded-sm px-2.5 text-xs font-medium transition-colors"
                title={`${CAMERA_PRESETS[id].label} view (${index + 1})`}
              >
                {CAMERA_PRESETS[id].label}
              </button>
            ))}
          </div>
          <div className="bg-surface/90 shadow-soft flex rounded-sm p-1 backdrop-blur">
            <button
              type="button"
              onClick={resetCamera}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-sm transition-colors"
              aria-label="Reset camera (R)"
              title="Reset camera (R)"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleFurniture}
              className="hover:bg-muted flex size-9 items-center justify-center rounded-sm transition-colors"
              aria-label={showFurniture ? "Hide furniture (F)" : "Show furniture (F)"}
              aria-pressed={!showFurniture}
              title="Toggle furniture (F)"
            >
              {showFurniture ? (
                <Eye className="size-4" aria-hidden />
              ) : (
                <EyeOff className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      )}

      {orbit && showHints && webgl && (
        <p
          id="room-viewer-hints"
          className="bg-surface/80 text-fg-muted pointer-events-none absolute top-3 left-3 z-20 hidden rounded-sm px-3 py-1.5 text-[11px] leading-relaxed backdrop-blur sm:block"
        >
          {coarsePointer
            ? "Drag to rotate · Pinch to zoom · Two fingers to move"
            : "Drag to rotate · Scroll to zoom · Right-drag to move · R reset · F furniture · 1–4 views"}
        </p>
      )}

      {LightTuner && tune && <LightTuner onChange={setTuning} />}
    </div>
  );
}
