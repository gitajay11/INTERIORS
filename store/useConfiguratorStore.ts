"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_CONFIG,
  DEFAULT_PRESET,
  FLOOR_IDS,
  FURNITURE,
  SLOT_IDS,
  cloneConfig,
  isHexColor,
  type DesignConfig,
  type FloorId,
  type PresetId,
  type SlotId,
} from "@/components/three/catalog";

/**
 * A camera request. The viewer reacts to `nonce` changing, so asking for the same
 * preset twice (e.g. "Front" after the user orbited away) still moves the camera.
 */
export interface CameraCommand {
  preset: PresetId;
  nonce: number;
}

export interface ConfiguratorState {
  config: DesignConfig;
  camera: CameraCommand;
  /** True once the saved (or shared) design has been loaded on the client. */
  hydrated: boolean;

  setWallColor: (hex: string) => void;
  setFloor: (floor: FloorId) => void;
  setFabric: (hex: string) => void;
  setVariant: (slot: SlotId, variant: string) => void;
  setSlotVisible: (slot: SlotId, visible: boolean) => void;
  toggleSlot: (slot: SlotId) => void;
  setEmptyRoom: (empty: boolean) => void;
  toggleEmptyRoom: () => void;
  goToPreset: (preset: PresetId) => void;
  resetCamera: () => void;
  resetDesign: () => void;
  /** Replace the whole design (shared link, mood board, project preset). */
  applyConfig: (config: DesignConfig) => void;
  markHydrated: () => void;
}

const updateSlot = (
  config: DesignConfig,
  slot: SlotId,
  patch: Partial<DesignConfig["furniture"][SlotId]>,
): DesignConfig => ({
  ...config,
  furniture: { ...config.furniture, [slot]: { ...config.furniture[slot], ...patch } },
});

export const useConfiguratorStore = create<ConfiguratorState>()(
  persist(
    (set) => ({
      config: cloneConfig(DEFAULT_CONFIG),
      camera: { preset: DEFAULT_PRESET, nonce: 0 },
      hydrated: false,

      setWallColor: (hex) => {
        if (!isHexColor(hex)) return;
        set((s) => ({ config: { ...s.config, wall: hex.toLowerCase() } }));
      },
      setFloor: (floor) => {
        if (!FLOOR_IDS.includes(floor)) return;
        set((s) => ({ config: { ...s.config, floor } }));
      },
      setFabric: (hex) => {
        if (!isHexColor(hex)) return;
        set((s) => ({ config: { ...s.config, fabric: hex.toLowerCase() } }));
      },
      setVariant: (slot, variant) => {
        if (!FURNITURE[slot]?.variants.some((v) => v.id === variant)) return;
        // Picking a variant implies the user wants to see it.
        set((s) => ({ config: updateSlot(s.config, slot, { variant, visible: true }) }));
      },
      setSlotVisible: (slot, visible) =>
        set((s) => ({ config: updateSlot(s.config, slot, { visible }) })),
      toggleSlot: (slot) =>
        set((s) => ({
          config: updateSlot(s.config, slot, { visible: !s.config.furniture[slot].visible }),
        })),
      setEmptyRoom: (empty) => set((s) => ({ config: { ...s.config, empty } })),
      toggleEmptyRoom: () => set((s) => ({ config: { ...s.config, empty: !s.config.empty } })),
      goToPreset: (preset) => set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 } })),
      resetCamera: () =>
        set((s) => ({ camera: { preset: DEFAULT_PRESET, nonce: s.camera.nonce + 1 } })),
      resetDesign: () => set({ config: cloneConfig(DEFAULT_CONFIG) }),
      applyConfig: (config) => set({ config: cloneConfig(config) }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "interiors-studio-design",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the design is persisted; camera state is per-visit.
      partialize: (state) => ({ config: state.config }),
      // Merge defensively: a stale or hand-edited entry must not break the scene.
      merge: (persisted, current) => {
        const saved = (persisted as { config?: Partial<DesignConfig> } | undefined)?.config;
        if (!saved) return current;
        const config = cloneConfig(DEFAULT_CONFIG);
        if (typeof saved.wall === "string" && isHexColor(saved.wall)) config.wall = saved.wall;
        if (typeof saved.fabric === "string" && isHexColor(saved.fabric)) {
          config.fabric = saved.fabric;
        }
        if (saved.floor && FLOOR_IDS.includes(saved.floor)) config.floor = saved.floor;
        config.empty = saved.empty === true;
        for (const slot of SLOT_IDS) {
          const state = saved.furniture?.[slot];
          if (!state) continue;
          if (FURNITURE[slot].variants.some((v) => v.id === state.variant)) {
            config.furniture[slot].variant = state.variant;
          }
          config.furniture[slot].visible = state.visible !== false;
        }
        return { ...current, config };
      },
      // Hydrate manually (see <Configurator />) so the server render and the first
      // client render agree, and a shared link can take priority over the saved design.
      skipHydration: true,
    },
  ),
);
