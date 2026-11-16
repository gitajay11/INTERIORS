"use client";

import { useEffect, useRef } from "react";
import { generateSurfaceAsync } from "@/lib/surface-client";
import type { SurfaceSpec } from "@/lib/surfaces";
import { cn } from "@/lib/utils";

/**
 * Thumbnail of a procedural surface, drawn from the same generator that
 * textures the 3D scene, so a swatch always matches what appears in the room.
 */
export function SwatchCanvas({
  surface,
  size = 128,
  className,
}: {
  surface: SurfaceSpec;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = ref.current?.getContext("2d");
    if (!context) return;
    let live = true;
    // A page can show dozens of swatches; generating them in the worker keeps scrolling smooth.
    void generateSurfaceAsync(surface, size).then((pixels) => {
      if (live) context.putImageData(new ImageData(pixels.albedo, size, size), 0, 0);
    });
    return () => {
      live = false;
    };
  }, [surface, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      // The flat base colour shows until the texture has been drawn.
      style={{ backgroundColor: surface.base }}
      className={cn("block size-full object-cover", className)}
      aria-hidden
    />
  );
}
