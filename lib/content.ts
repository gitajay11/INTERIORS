"use cache";

/**
 * Content access layer.
 *
 * Every page reads content through these functions. Each one tries Sanity first
 * (when SANITY_PROJECT_ID is set) and falls back to the demo content in
 * lib/data, so the site is fully browsable before a CMS exists.
 *
 * The whole module is cached ("use cache"): results are part of the static
 * shell and are revalidated in the background on the `hours` profile, which is
 * how the App Router expresses ISR with Cache Components.
 */
import { cacheLife } from "next/cache";
import { makeConfig, type FloorId, type LayoutId, type SlotId } from "@/components/three/catalog";
import { materials as seedMaterials, moodBoards as seedMoodBoards } from "@/lib/data/materials";
import { posts as seedPosts } from "@/lib/data/posts";
import { projects as seedProjects } from "@/lib/data/projects";
import { services as seedServices } from "@/lib/data/services";
import {
  awards as seedAwards,
  team as seedTeam,
  testimonials as seedTestimonials,
} from "@/lib/data/studio";
import { imageProjection, sanityFetch } from "@/lib/sanity";
import type {
  Award,
  Material,
  MoodBoard,
  Post,
  Project,
  Service,
  TeamMember,
  Testimonial,
} from "@/lib/types";

// ---- Projects ---------------------------------------------------------------
interface SanityProject extends Omit<Project, "design" | "layout" | "materials"> {
  layout?: LayoutId;
  wallColor?: string;
  floor?: FloorId;
  fabricColor?: string;
  variants?: Partial<Record<SlotId, string>>;
  materials?: string[];
}

const projectQuery = `*[_type == "project"] | order(year desc) {
  "slug": slug.current, title, summary, type, category, clientType, location, area, year,
  duration, budgetRange, style, featured,
  "coverImage": coverImage${imageProjection},
  "gallery": gallery[]${imageProjection},
  "beforeAfter": { "before": beforeImage${imageProjection}, "after": afterImage${imageProjection} },
  "model3D": model3D.asset->url,
  layout, wallColor, floor, fabricColor, variants, initialPreset,
  "floorPlan": coalesce(floorPlan, []),
  "materials": materials[]->slug.current,
  description
}`;

function fromSanityProject(doc: SanityProject): Project {
  const { wallColor, floor, fabricColor, variants, ...rest } = doc;
  return {
    ...rest,
    layout: doc.layout ?? "living",
    initialPreset: doc.initialPreset ?? "corner",
    materials: doc.materials ?? [],
    gallery: doc.gallery ?? [],
    floorPlan: doc.floorPlan ?? [],
    design: makeConfig({ wall: wallColor, floor, fabric: fabricColor, variants }),
  };
}

export async function getProjects(): Promise<Project[]> {
  cacheLife("hours");
  const docs = await sanityFetch<SanityProject[]>(projectQuery);
  return docs ? docs.map(fromSanityProject) : seedProjects;
}

export async function getProject(slug: string): Promise<Project | null> {
  cacheLife("hours");
  const all = await getProjects();
  return all.find((project) => project.slug === slug) ?? null;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  cacheLife("hours");
  return (await getProjects()).filter((project) => project.featured);
}

// ---- Services ---------------------------------------------------------------
export async function getServices(): Promise<Service[]> {
  cacheLife("hours");
  const docs = await sanityFetch<Service[]>(`*[_type == "service"] | order(order asc) {
    "slug": slug.current, title, icon, summary, description, included, process, faqs,
    "image": image${imageProjection}, sampleCategories
  }`);
  return docs ?? seedServices;
}

export async function getService(slug: string): Promise<Service | null> {
  cacheLife("hours");
  return (await getServices()).find((service) => service.slug === slug) ?? null;
}

// ---- Team, testimonials, awards --------------------------------------------
export async function getTeam(): Promise<TeamMember[]> {
  cacheLife("hours");
  const docs = await sanityFetch<TeamMember[]>(`*[_type == "teamMember"] | order(order asc) {
    "slug": slug.current, name, role, bio, expertise, "tint": coalesce(tint, "#c8b99d"),
    "photo": photo${imageProjection}, "socials": coalesce(socials, [])
  }`);
  return docs ?? seedTeam;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  cacheLife("hours");
  const docs = await sanityFetch<Testimonial[]>(`*[_type == "testimonial"] {
    name, projectType, location, rating, quote, "tint": coalesce(tint, "#c8b99d")
  }`);
  return docs ?? seedTestimonials;
}

export async function getAwards(): Promise<Award[]> {
  cacheLife("hours");
  const docs = await sanityFetch<Award[]>(
    `*[_type == "award"] | order(year desc) { title, organisation, year, project }`,
  );
  return docs ?? seedAwards;
}

// ---- Materials --------------------------------------------------------------
export async function getMaterials(): Promise<Material[]> {
  cacheLife("hours");
  const docs = await sanityFetch<Material[]>(`*[_type == "material"] | order(name asc) {
    "slug": slug.current, name, category, origin, finish, description, useCases, maintenance, surface
  }`);
  return docs ?? seedMaterials;
}

export async function getMoodBoards(): Promise<MoodBoard[]> {
  cacheLife("hours");
  // Mood boards reference 3D Studio presets, so they are maintained in code.
  return seedMoodBoards;
}

// ---- Journal ----------------------------------------------------------------
export async function getPosts(): Promise<Post[]> {
  cacheLife("hours");
  const docs = await sanityFetch<Post[]>(`*[_type == "post"] | order(publishedAt desc) {
    "slug": slug.current, title, excerpt, "category": category->title, publishedAt,
    "author": author->slug.current, "coverImage": coverImage${imageProjection}, body,
    "featured": coalesce(featured, false)
  }`);
  return docs ?? seedPosts;
}

export async function getPost(slug: string): Promise<Post | null> {
  cacheLife("hours");
  return (await getPosts()).find((post) => post.slug === slug) ?? null;
}
