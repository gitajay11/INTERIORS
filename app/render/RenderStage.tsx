"use client";

/**
 * Full-window, chrome-free render of a room for the image pipeline.
 *
 *   /render?project=<slug>&shot=<cover|wide|detail|side|plan|before|after>
 *   /render?hero=1
 *   /render?tour=1&at=<0–1>                             (home page walkthrough, at a scroll fraction)
 *   /render?<design params>&layout=living&shot=cover     (ad-hoc)
 *
 * Sets `window.__renderReady = true` once the frame is on screen.
 */
import { useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import RoomViewer from "@/components/three/RoomViewer";
import TourCanvas from "@/components/three/tour/TourCanvas";
import { scrollToCurve } from "@/components/three/tour/plan";
import { DEFAULT_CONFIG, LAYOUT_IDS, makeConfig, type LayoutId } from "@/components/three/catalog";
import { projects } from "@/lib/data/projects";
import { decodeConfig } from "@/lib/design-config";
import { HERO_SHOT, SHOT_NAMES, getShot, type ShotName } from "@/lib/render-shots";

declare global {
  interface Window {
    __renderReady?: boolean;
  }
}

export function RenderStage() {
  const params = useSearchParams();

  const scene = useMemo(() => {
    const project = projects.find((p) => p.slug === params.get("project"));
    const layoutParam = params.get("layout") as LayoutId | null;
    const layout =
      project?.layout ?? (layoutParam && LAYOUT_IDS.includes(layoutParam) ? layoutParam : "living");
    const shotParam = params.get("shot") as ShotName | null;
    const shot = params.get("hero")
      ? HERO_SHOT
      : getShot(shotParam && SHOT_NAMES.includes(shotParam) ? shotParam : "cover", layout);
    const design = project?.design ?? decodeConfig(params) ?? DEFAULT_CONFIG;
    const config = shot.bare
      ? makeConfig({ wall: "#f1eee8", floor: "concrete", empty: true })
      : design;
    return { layout, shot, config };
  }, [params]);

  const onReady = useCallback(() => {
    // Give shadows, the environment map and post-processing a few frames to settle.
    setTimeout(() => {
      window.__renderReady = true;
    }, 1200);
  }, []);

  const tourProgress = useRef(scrollToCurve(Number(params.get("at") ?? 0)));
  if (params.get("tour")) {
    return (
      <div className="fixed inset-0">
        <TourCanvas progress={tourProgress} quality="high" onReady={onReady} />
      </div>
    );
  }

  return (
    <RoomViewer
      className="fixed inset-0"
      config={scene.config}
      layout={scene.layout}
      initialView={scene.shot}
      showControls={false}
      showHints={false}
      shortcuts={false}
      quality="high"
      background="#e7e1d6"
      onReady={onReady}
    />
  );
}
