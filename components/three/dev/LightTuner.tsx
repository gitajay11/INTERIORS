"use client";

/**
 * Development-only Leva panel for tuning scene lighting.
 * Open any page with a viewer and add `?tune` to the URL (e.g. /studio?tune).
 * Copy the values you like into DEFAULT_LIGHTING in RoomScene.tsx.
 */
import { useEffect } from "react";
import { useControls } from "leva";
import { DEFAULT_LIGHTING, type LightTuning } from "../RoomScene";

export default function LightTuner({ onChange }: { onChange: (tuning: LightTuning) => void }) {
  const values = useControls("Lighting", {
    sun: { value: DEFAULT_LIGHTING.sun, min: 0, max: 6, step: 0.05 },
    ambient: { value: DEFAULT_LIGHTING.ambient, min: 0, max: 2, step: 0.05 },
    environment: { value: DEFAULT_LIGHTING.environment, min: 0, max: 3, step: 0.05 },
  });
  const { sun, ambient, environment } = values;
  useEffect(() => onChange({ sun, ambient, environment }), [sun, ambient, environment, onChange]);
  return null;
}
