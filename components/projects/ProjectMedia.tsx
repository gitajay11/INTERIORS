"use client";

/** Gallery and lightbox for a project page. */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/primitives";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Lightbox: keyboard (←/→, +/−, Esc), swipe, zoom + drag to pan
// ---------------------------------------------------------------------------
function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: ImageAsset[];
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointer = useRef<{ x: number; y: number; startX: number } | null>(null);
  const open = index !== null;
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      setZoomed(false);
      setPan({ x: 0, y: 0 });
      onIndexChange((index + delta + count) % count);
    },
    [index, count, onIndexChange],
  );

  const toggleZoom = useCallback(() => {
    setZoomed((value) => !value);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "+" || event.key === "=") setZoomed(true);
      else if (event.key === "-") {
        setZoomed(false);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  const onPointerDown = (event: ReactPointerEvent) => {
    pointer.current = { x: event.clientX, y: event.clientY, startX: event.clientX };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent) => {
    const state = pointer.current;
    if (!state || !zoomed) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    state.x = event.clientX;
    state.y = event.clientY;
    setPan((current) => ({
      x: Math.min(500, Math.max(-500, current.x + dx)),
      y: Math.min(350, Math.max(-350, current.y + dy)),
    }));
  };
  const onPointerUp = (event: ReactPointerEvent) => {
    const state = pointer.current;
    pointer.current = null;
    if (!state || zoomed) return;
    // A horizontal swipe changes photo.
    const distance = event.clientX - state.startX;
    if (Math.abs(distance) > 60) go(distance < 0 ? 1 : -1);
  };

  const image = index !== null ? images[index] : null;
  const button =
    "flex size-11 items-center justify-center rounded-sm bg-black/40 text-white transition-colors hover:bg-black/60";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setZoomed(false);
          setPan({ x: 0, y: 0 });
          onClose();
        }
      }}
    >
      <DialogContent
        side="full"
        label="Photo viewer"
        className="flex flex-col overflow-hidden bg-[#141312] text-white"
      >
        {image && index !== null && (
          <>
            <div
              className={cn(
                "relative min-h-0 flex-1 touch-none",
                zoomed ? "cursor-grab" : "cursor-zoom-in",
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={toggleZoom}
            >
              <Image
                key={image.src}
                src={image.src}
                alt={image.alt}
                fill
                sizes="100vw"
                quality={90}
                draggable={false}
                className="animate-fade-in object-contain transition-transform duration-200 ease-out select-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomed ? 2.2 : 1})`,
                }}
              />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-4 p-3">
              <p className="min-w-0 flex-1 truncate text-sm text-white/80" aria-live="polite">
                <span className="mr-3 tabular-nums">
                  {index + 1} / {count}
                </span>
                {image.alt}
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className={button}
                  onClick={toggleZoom}
                  aria-label={zoomed ? "Zoom out" : "Zoom in"}
                >
                  {zoomed ? (
                    <ZoomOut className="size-5" aria-hidden />
                  ) : (
                    <ZoomIn className="size-5" aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => go(-1)}
                  aria-label="Previous photo"
                >
                  <ArrowLeft className="size-5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={button}
                  onClick={() => go(1)}
                  aria-label="Next photo"
                >
                  <ArrowRight className="size-5" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------
export function ProjectMedia({ gallery }: { gallery: ImageAsset[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <section className="container-page section" aria-labelledby="gallery-title">
        <p className="eyebrow">Gallery</p>
        <h2 id="gallery-title" className="mt-3 mb-10 text-4xl md:text-5xl">
          A closer look
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:gap-6">
          {gallery.map((image, index) => (
            <li key={image.src} className={cn(index === 0 && "sm:col-span-2")}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                className={cn(
                  "group bg-muted relative block w-full cursor-zoom-in overflow-hidden rounded-sm",
                  index === 0 ? "aspect-[16/9]" : "aspect-[4/3]",
                )}
                aria-label={`Open photo ${index + 1}: ${image.alt}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes={
                    index === 0
                      ? "(min-width: 1344px) 1264px, 100vw"
                      : "(min-width: 640px) 50vw, 100vw"
                  }
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <Lightbox
        images={gallery}
        index={open}
        onIndexChange={setOpen}
        onClose={() => setOpen(null)}
      />
    </>
  );
}
