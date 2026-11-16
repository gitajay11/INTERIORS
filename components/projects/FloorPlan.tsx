"use client";

/**
 * Zoomable, pannable floor plan drawn as SVG from the same room layout the 3D
 * scene uses. Numbered hotspots open the matching gallery photo.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { ROOM, type LayoutId } from "@/components/three/catalog";
import type { FloorPlanHotspot } from "@/lib/types";

type Shape =
  | { kind: "rect"; x: number; z: number; w: number; d: number; label?: string; dashed?: boolean }
  | { kind: "circle"; x: number; z: number; r: number; label?: string };

// Plan symbols per layout, in room metres (x: left→right, z: back→front).
const PLANS: Record<LayoutId, Shape[]> = {
  living: [
    { kind: "rect", x: -1.65, z: -1.5, w: 3.3, d: 2.3, dashed: true },
    { kind: "rect", x: -1.2, z: -2.37, w: 2.4, d: 0.95, label: "Sofa" },
    { kind: "circle", x: 0, z: -0.4, r: 0.52, label: "Table" },
    { kind: "circle", x: -2.2, z: -0.1, r: 0.42 },
    { kind: "circle", x: 2.2, z: 0.05, r: 0.42 },
    { kind: "rect", x: 3.09, z: -2.15, w: 0.34, d: 1.4, label: "Shelves" },
    { kind: "circle", x: 2.5, z: -2.25, r: 0.2 },
    { kind: "circle", x: -2.85, z: -2.2, r: 0.26 },
  ],
  bedroom: [
    { kind: "rect", x: -1.8, z: -2.0, w: 3.6, d: 2.6, dashed: true },
    { kind: "rect", x: -0.975, z: -2.66, w: 1.95, d: 2.15, label: "Bed" },
    { kind: "rect", x: -1.6, z: -2.64, w: 0.5, d: 0.4 },
    { kind: "rect", x: 1.1, z: -2.64, w: 0.5, d: 0.4 },
    { kind: "rect", x: -0.7, z: -0.39, w: 1.4, d: 0.42, label: "Bench" },
    { kind: "circle", x: 2.35, z: 1.3, r: 0.42 },
    { kind: "rect", x: 3.0, z: -2.25, w: 0.45, d: 1.7, label: "Dresser" },
    { kind: "circle", x: -2.85, z: 1.9, r: 0.26 },
  ],
  dining: [
    { kind: "rect", x: -1.75, z: -0.7, w: 3.5, d: 2.5, dashed: true },
    { kind: "rect", x: -2.4, z: -2.74, w: 4.8, d: 0.62, label: "Kitchen" },
    { kind: "rect", x: -1.15, z: 0.05, w: 2.3, d: 1.0, label: "Dining" },
    ...[-0.72, 0, 0.72].flatMap((x): Shape[] => [
      { kind: "rect", x: x - 0.23, z: -0.36, w: 0.46, d: 0.46 },
      { kind: "rect", x: x - 0.23, z: 1.0, w: 0.46, d: 0.46 },
    ]),
    { kind: "rect", x: 3.0, z: 0, w: 0.45, d: 1.8, label: "Credenza" },
    { kind: "circle", x: -2.85, z: 2.1, r: 0.26 },
  ],
  office: [
    { kind: "rect", x: -1.65, z: -2.05, w: 3.3, d: 2.3, dashed: true },
    { kind: "rect", x: -2.3, z: -2.72, w: 4.6, d: 0.34, label: "Library" },
    { kind: "rect", x: -0.95, z: -1.17, w: 1.9, d: 0.85, label: "Desk" },
    { kind: "circle", x: 0, z: -1.55, r: 0.26 },
    { kind: "circle", x: -0.6, z: 0.75, r: 0.42 },
    { kind: "circle", x: 0.6, z: 0.75, r: 0.42 },
    { kind: "circle", x: 3.0, z: 0.4, r: 0.2 },
    { kind: "circle", x: -2.9, z: 2.0, r: 0.26 },
  ],
};

const S = 100; // SVG units per metre
const PAD = 60;
const W = ROOM.width * S;
const D = ROOM.depth * S;
const px = (x: number) => (x + ROOM.width / 2) * S + PAD;
const pz = (z: number) => (z + ROOM.depth / 2) * S + PAD;

interface View {
  scale: number;
  x: number;
  y: number;
}
const HOME: View = { scale: 1, x: 0, y: 0 };
const clampScale = (scale: number) => Math.min(4, Math.max(1, scale));

export function FloorPlan({
  layout,
  hotspots,
  onSelect,
}: {
  layout: LayoutId;
  hotspots: FloorPlanHotspot[];
  onSelect: (galleryIndex: number) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(HOME);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);

  const zoom = (factor: number) =>
    setView((current) => {
      const scale = clampScale(current.scale * factor);
      return scale === 1 ? HOME : { ...current, scale };
    });

  // Ctrl + wheel (and trackpad pinch) zooms; a plain wheel keeps scrolling the page.
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (view.scale === 1) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) state.moved = true;
    state.x = event.clientX;
    state.y = event.clientY;
    setView((current) => {
      // Keep at least part of the plan in the frame.
      const limitX = ((current.scale - 1) * (frame.current?.clientWidth ?? 0)) / 2;
      const limitY = ((current.scale - 1) * (frame.current?.clientHeight ?? 0)) / 2;
      return {
        ...current,
        x: Math.min(limitX, Math.max(-limitX, current.x + dx)),
        y: Math.min(limitY, Math.max(-limitY, current.y + dy)),
      };
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const control =
    "bg-surface hover:bg-muted border-border flex size-11 items-center justify-center border transition-colors first:rounded-l-sm last:rounded-r-sm disabled:opacity-40";

  return (
    <div>
      <div
        ref={frame}
        className="border-border bg-surface relative aspect-[4/3] touch-none overflow-hidden rounded-sm border sm:aspect-[3/2]"
        style={{ cursor: view.scale > 1 ? "grab" : "default" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg
          viewBox={`0 0 ${W + PAD * 2} ${D + PAD * 2}`}
          className="size-full transition-transform duration-150 ease-out"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
          role="group"
          aria-label="Floor plan"
        >
          {/* walls */}
          <rect
            x={PAD - 8}
            y={PAD - 8}
            width={W + 16}
            height={D + 16}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={8}
          />
          {/* window on the left wall */}
          <line
            x1={PAD - 8}
            x2={PAD - 8}
            y1={pz(-1.5)}
            y2={pz(1.1)}
            stroke="var(--surface)"
            strokeWidth={10}
          />
          <line
            x1={PAD - 8}
            x2={PAD - 8}
            y1={pz(-1.5)}
            y2={pz(1.1)}
            stroke="var(--accent)"
            strokeWidth={3}
          />
          <text
            x={PAD + 12}
            y={pz(-0.2)}
            fontSize={15}
            fill="var(--fg-muted)"
            transform={`rotate(-90 ${PAD + 12} ${pz(-0.2)})`}
            textAnchor="middle"
          >
            Window
          </text>

          {PLANS[layout].map((shape, index) =>
            shape.kind === "rect" ? (
              <g key={index}>
                <rect
                  x={px(shape.x)}
                  y={pz(shape.z)}
                  width={shape.w * S}
                  height={shape.d * S}
                  rx={6}
                  fill={shape.dashed ? "none" : "var(--muted)"}
                  stroke="var(--fg-muted)"
                  strokeWidth={1.5}
                  strokeDasharray={shape.dashed ? "8 6" : undefined}
                />
                {shape.label && (
                  <text
                    x={px(shape.x) + (shape.w * S) / 2}
                    y={pz(shape.z) + (shape.d * S) / 2 + 5}
                    fontSize={15}
                    textAnchor="middle"
                    fill="var(--fg)"
                    transform={
                      shape.d > shape.w * 1.5
                        ? `rotate(-90 ${px(shape.x) + (shape.w * S) / 2} ${pz(shape.z) + (shape.d * S) / 2})`
                        : undefined
                    }
                  >
                    {shape.label}
                  </text>
                )}
              </g>
            ) : (
              <g key={index}>
                <circle
                  cx={px(shape.x)}
                  cy={pz(shape.z)}
                  r={shape.r * S}
                  fill="var(--muted)"
                  stroke="var(--fg-muted)"
                  strokeWidth={1.5}
                />
                {shape.label && (
                  <text
                    x={px(shape.x)}
                    y={pz(shape.z) + 5}
                    fontSize={15}
                    textAnchor="middle"
                    fill="var(--fg)"
                  >
                    {shape.label}
                  </text>
                )}
              </g>
            ),
          )}

          {/* dimensions */}
          <text
            x={PAD + W / 2}
            y={PAD + D + 40}
            fontSize={16}
            textAnchor="middle"
            fill="var(--fg-muted)"
          >
            {ROOM.width.toFixed(1)} m
          </text>
          <text
            x={PAD + W + 40}
            y={PAD + D / 2}
            fontSize={16}
            textAnchor="middle"
            fill="var(--fg-muted)"
            transform={`rotate(90 ${PAD + W + 40} ${PAD + D / 2})`}
          >
            {ROOM.depth.toFixed(1)} m
          </text>

          {/* hotspots */}
          {hotspots.map((spot, index) => (
            <g
              key={spot.label}
              role="button"
              tabIndex={0}
              aria-label={`${spot.label}: open photo ${spot.galleryIndex + 1}`}
              className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-[var(--fg)] [&:hover>circle]:opacity-90"
              onClick={() => {
                if (!drag.current?.moved) onSelect(spot.galleryIndex);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(spot.galleryIndex);
                }
              }}
            >
              <circle
                cx={px(spot.x)}
                cy={pz(spot.z)}
                r={26}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={4}
              />
              <text
                x={px(spot.x)}
                y={pz(spot.z) + 6}
                fontSize={18}
                fontWeight={600}
                textAnchor="middle"
                fill="var(--accent-fg)"
              >
                {index + 1}
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute right-3 bottom-3 flex" role="group" aria-label="Floor plan zoom">
          <button
            type="button"
            className={control}
            onClick={() => zoom(1 / 1.4)}
            disabled={view.scale === 1}
            aria-label="Zoom out"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={control}
            onClick={() => setView(HOME)}
            disabled={view.scale === 1}
            aria-label="Reset zoom"
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={control}
            onClick={() => zoom(1.4)}
            disabled={view.scale === 4}
            aria-label="Zoom in"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <ol className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {hotspots.map((spot, index) => (
          <li key={spot.label}>
            <button
              type="button"
              onClick={() => onSelect(spot.galleryIndex)}
              className="hover:text-accent flex min-h-9 items-center gap-2"
            >
              <span className="bg-accent text-accent-fg flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                {index + 1}
              </span>
              {spot.label}
            </button>
          </li>
        ))}
      </ol>
      <p className="text-fg-muted mt-2 text-xs">
        Use the buttons, or Ctrl + scroll / pinch, to zoom; drag to pan. Select a number to see that
        part of the room.
      </p>
    </div>
  );
}
