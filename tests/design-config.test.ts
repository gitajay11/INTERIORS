import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, makeConfig } from "@/components/three/catalog";
import { decodeConfig, describeConfig, encodeConfig } from "@/lib/design-config";

describe("design URL codec", () => {
  it("encodes the default design as an empty query", () => {
    expect(encodeConfig(DEFAULT_CONFIG)).toBe("");
    expect(decodeConfig(new URLSearchParams(""))).toBeNull();
  });

  it("round-trips a customised design", () => {
    const design = makeConfig({
      wall: "#c49a7c",
      floor: "marble",
      fabric: "#6b7257",
      variants: { sofa: "curve", table: "nest", lamps: "tripod" },
      hidden: ["rug", "decor"],
      empty: true,
    });
    const query = encodeConfig(design);
    expect(query).toContain("wall=c49a7c");
    expect(query).toContain("hide=rug%2Cdecor");
    expect(decodeConfig(new URLSearchParams(query))).toEqual(design);
  });

  it("can force a full encoding for links that must override a saved design", () => {
    const query = encodeConfig(DEFAULT_CONFIG, true);
    expect(query).not.toBe("");
    expect(decodeConfig(new URLSearchParams(query))).toEqual(DEFAULT_CONFIG);
  });

  it("ignores tampered values instead of producing an invalid scene", () => {
    const decoded = decodeConfig({
      wall: "zzzzzz",
      floor: "lava",
      sofa: "throne",
      hide: "rug,spaceship",
      table: "slab",
    });
    expect(decoded).not.toBeNull();
    expect(decoded!.wall).toBe(DEFAULT_CONFIG.wall);
    expect(decoded!.floor).toBe(DEFAULT_CONFIG.floor);
    expect(decoded!.furniture.sofa.variant).toBe("lounge");
    expect(decoded!.furniture.table.variant).toBe("slab");
    expect(decoded!.furniture.rug.visible).toBe(false);
  });

  it("describes a design in words", () => {
    expect(describeConfig(DEFAULT_CONFIG)).toContain("Sofa: Lounge");
    expect(describeConfig(makeConfig({ empty: true }))).toContain("Empty room");
  });
});
