"use client";

/**
 * Lazy entry point for <RoomViewer />.
 *
 * three.js, R3F and the scene are code-split (`ssr: false`) and only requested
 * once the placeholder is close to the viewport, so pages that merely contain a
 * viewer further down do not pay for it up front.
 */
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { RoomViewerProps } from "./RoomViewer";
import { cn } from "@/lib/utils";

const RoomViewer = dynamic(() => import("./RoomViewer"), { ssr: false });

export type { RoomViewerHandle, RoomViewerProps } from "./RoomViewer";

export function LazyRoomViewer({ className, ...props }: RoomViewerProps) {
  const placeholder = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = placeholder.current;
    if (!node || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  if (near) return <RoomViewer className={className} {...props} />;

  return (
    <div
      ref={placeholder}
      className={cn("bg-muted flex items-center justify-center", className)}
      role="status"
      aria-label="Loading 3D viewer"
    >
      <span className="text-fg-muted font-serif text-xl">Preparing the room</span>
    </div>
  );
}
