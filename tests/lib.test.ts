import { describe, expect, it } from "vitest";
import { filterProjects } from "@/components/projects/ProjectsExplorer";
import { filterPosts } from "@/components/sections/JournalExplorer";
import { materials, moodBoards } from "@/lib/data/materials";
import { posts } from "@/lib/data/posts";
import { projects } from "@/lib/data/projects";
import { blocks, headings, readingTime, toPlainText } from "@/lib/data/rich-text";
import { services } from "@/lib/data/services";
import { team } from "@/lib/data/studio";
import { rateLimit } from "@/lib/rate-limit";
import { generateSurface } from "@/lib/surfaces";

describe("procedural surfaces", () => {
  it.each(materials.map((material) => [material.slug, material.surface] as const))(
    "generates a full PBR set for %s",
    (_slug, surface) => {
      const size = 32;
      const pixels = generateSurface(surface, size);
      for (const map of [pixels.albedo, pixels.normal, pixels.roughness]) {
        expect(map).toHaveLength(size * size * 4);
        expect(map[3]).toBe(255); // opaque
      }
      // Normals point mostly "up" out of the surface.
      expect(pixels.normal[2]).toBeGreaterThan(127);
    },
  );

  it("is deterministic", () => {
    const a = generateSurface(materials[0].surface, 16);
    const b = generateSurface(materials[0].surface, 16);
    expect(Array.from(a.albedo)).toEqual(Array.from(b.albedo));
  });
});

describe("rate limiter", () => {
  it("allows a burst up to the limit, then blocks until the window passes", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 1000, 1000 + i)).toBe(true);
    expect(rateLimit(key, 3, 1000, 1500)).toBe(false);
    expect(rateLimit(key, 3, 1000, 2100)).toBe(true);
  });

  it("tracks keys separately", () => {
    expect(rateLimit("a-key", 1, 1000, 0)).toBe(true);
    expect(rateLimit("b-key", 1, 1000, 0)).toBe(true);
    expect(rateLimit("a-key", 1, 1000, 1)).toBe(false);
  });
});

describe("project filters", () => {
  it("filters by type and category", () => {
    expect(
      filterProjects(projects, { type: "commercial" }).every((p) => p.type === "commercial"),
    ).toBe(true);
    expect(filterProjects(projects, { category: "Kitchen" }).map((p) => p.slug)).toEqual([
      "adyar-kitchen",
    ]);
    expect(filterProjects(projects, { type: "commercial", category: "Kitchen" })).toEqual([]);
  });

  it("searches across title, city and style", () => {
    expect(filterProjects(projects, { q: "goa" }).map((p) => p.slug)).toEqual(["the-fig-house"]);
    expect(filterProjects(projects, { q: "JAPANDI" })).toHaveLength(1);
  });

  it("sorts by year and by area", () => {
    const years = filterProjects(projects, {}).map((p) => p.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    const areas = filterProjects(projects, { sort: "area-asc" }).map((p) => p.area);
    expect(areas).toEqual([...areas].sort((a, b) => a - b));
  });
});

describe("journal", () => {
  it("filters posts by category and search", () => {
    expect(filterPosts(posts, { category: "Design tips" })).toHaveLength(2);
    expect(filterPosts(posts, { q: "herringbone" }).map((p) => p.slug)).toEqual([
      "choosing-a-wood-floor",
    ]);
  });

  it("derives plain text, reading time and headings from rich text", () => {
    const body = blocks(
      "Intro paragraph.",
      "## First heading",
      "Text.",
      "### A sub-heading",
      "> A quote",
    );
    expect(toPlainText(body)).toContain("Intro paragraph.");
    expect(readingTime(body)).toBe(1);
    expect(headings(body)).toEqual([
      { id: "first-heading", text: "First heading", level: 2 },
      { id: "a-sub-heading", text: "A sub-heading", level: 3 },
    ]);
  });
});

describe("demo content", () => {
  it("meets the minimum content counts", () => {
    expect(projects.length).toBeGreaterThanOrEqual(6);
    expect(services).toHaveLength(6);
    expect(team.length).toBeGreaterThanOrEqual(4);
    expect(posts.length).toBeGreaterThanOrEqual(6);
    expect(materials.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique slugs and valid cross-references", () => {
    const materialSlugs = new Set(materials.map((m) => m.slug));
    expect(materialSlugs.size).toBe(materials.length);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    for (const project of projects) {
      for (const slug of project.materials)
        expect(materialSlugs, `${project.slug}: ${slug}`).toContain(slug);
    }
    for (const board of moodBoards) {
      for (const slug of board.materials)
        expect(materialSlugs, `${board.slug}: ${slug}`).toContain(slug);
    }
    const authors = new Set(team.map((member) => member.slug));
    for (const post of posts) expect(authors).toContain(post.author);
  });
});
