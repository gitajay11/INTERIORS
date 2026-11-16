"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";
import type { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Before / after comparison. The whole surface is a native range input, so it
 * works with mouse, touch and keyboard (arrow keys) and announces its value.
 */
export function BeforeAfter({
  before,
  after,
  className,
}: {
  before: ImageAsset;
  after: ImageAsset;
  className?: string;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <div
      className={cn(
        "bg-muted relative aspect-[3/2] overflow-hidden rounded-sm select-none",
        className,
      )}
    >
      <Image
        src={after.src}
        alt={after.alt}
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={before.src}
          alt={before.alt}
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="object-cover"
        />
      </div>

      <span className="pointer-events-none absolute top-4 left-4 rounded-sm bg-black/60 px-2.5 py-1 text-xs font-medium tracking-wide text-white uppercase">
        Before
      </span>
      <span className="pointer-events-none absolute top-4 right-4 rounded-sm bg-black/60 px-2.5 py-1 text-xs font-medium tracking-wide text-white uppercase">
        After
      </span>

      {/* divider + handle (purely visual; the range input below does the work) */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-white"
        style={{ left: `${position}%` }}
        aria-hidden
      >
        <span className="shadow-soft absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2b2926]">
          <ChevronsLeftRight className="size-5" />
        </span>
      </div>

      <label htmlFor={id} className="sr-only">
        Reveal the before image
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-valuetext={`${position}% before, ${100 - position}% after`}
        className="peer absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
      <span className="ring-ring pointer-events-none absolute inset-0 rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-inset" />
    </div>
  );
}
