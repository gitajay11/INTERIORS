import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, DEFAULT_PRESET, makeConfig } from "@/components/three/catalog";
import { useConfiguratorStore } from "@/store/useConfiguratorStore";

const state = () => useConfiguratorStore.getState();

describe("configurator store", () => {
  beforeEach(() => {
    state().resetDesign();
  });

  it("starts from the default design", () => {
    expect(state().config).toEqual(DEFAULT_CONFIG);
    expect(state().config).not.toBe(DEFAULT_CONFIG); // a copy, never the shared default
  });

  it("changes the wall colour and rejects invalid values", () => {
    state().setWallColor("#AABBCC");
    expect(state().config.wall).toBe("#aabbcc");
    state().setWallColor("not-a-colour");
    expect(state().config.wall).toBe("#aabbcc");
  });

  it("selects flooring", () => {
    state().setFloor("marble");
    expect(state().config.floor).toBe("marble");
    // @ts-expect-error unknown floors are ignored at runtime
    state().setFloor("lava");
    expect(state().config.floor).toBe("marble");
  });

  it("switches furniture variants and re-shows a hidden item", () => {
    state().setSlotVisible("sofa", false);
    state().setVariant("sofa", "curve");
    expect(state().config.furniture.sofa).toEqual({ variant: "curve", visible: true });
    state().setVariant("sofa", "beanbag");
    expect(state().config.furniture.sofa.variant).toBe("curve");
  });

  it("toggles item visibility and the empty-room switch independently", () => {
    state().toggleSlot("rug");
    expect(state().config.furniture.rug.visible).toBe(false);
    state().toggleEmptyRoom();
    expect(state().config.empty).toBe(true);
    // Per-item choices survive the empty-room toggle.
    state().toggleEmptyRoom();
    expect(state().config.furniture.rug.visible).toBe(false);
    expect(state().config.furniture.sofa.visible).toBe(true);
  });

  it("issues a new camera command for every request, even for the same preset", () => {
    const before = state().camera.nonce;
    state().goToPreset("top");
    state().goToPreset("top");
    expect(state().camera).toEqual({ preset: "top", nonce: before + 2 });
    state().resetCamera();
    expect(state().camera.preset).toBe(DEFAULT_PRESET);
  });

  it("resets the design without touching the default object", () => {
    state().setWallColor("#000000");
    state().setVariant("table", "nest");
    state().resetDesign();
    expect(state().config).toEqual(DEFAULT_CONFIG);
    expect(DEFAULT_CONFIG.furniture.table.variant).toBe("round");
  });

  it("applies a whole design as a copy", () => {
    const design = makeConfig({
      wall: "#4a4743",
      floor: "walnut",
      variants: { sofa: "sectional" },
      hidden: ["lamps"],
    });
    state().applyConfig(design);
    expect(state().config).toEqual(design);
    state().setWallColor("#ffffff");
    expect(design.wall).toBe("#4a4743");
  });

  it("persists only the design to localStorage", () => {
    state().setFloor("tiles");
    const saved = JSON.parse(localStorage.getItem("interiors-studio-design") ?? "{}");
    expect(saved.state.config.floor).toBe("tiles");
    expect(saved.state.camera).toBeUndefined();
  });

  it("restores a saved design and discards corrupt values", async () => {
    localStorage.setItem(
      "interiors-studio-design",
      JSON.stringify({
        version: 1,
        state: {
          config: {
            wall: "#123456",
            floor: "lava",
            fabric: "oops",
            empty: true,
            furniture: {
              sofa: { variant: "sectional", visible: false },
              table: { variant: "ghost", visible: true },
            },
          },
        },
      }),
    );
    await useConfiguratorStore.persist.rehydrate();
    const { config } = state();
    expect(config.wall).toBe("#123456");
    expect(config.floor).toBe(DEFAULT_CONFIG.floor);
    expect(config.fabric).toBe(DEFAULT_CONFIG.fabric);
    expect(config.empty).toBe(true);
    expect(config.furniture.sofa).toEqual({ variant: "sectional", visible: false });
    expect(config.furniture.table.variant).toBe(DEFAULT_CONFIG.furniture.table.variant);
    expect(config.furniture.rug).toEqual(DEFAULT_CONFIG.furniture.rug);
  });
});
