import type { PortableTextBlock } from "@portabletext/react";
import type { DesignConfig, LayoutId, PresetId } from "@/components/three/catalog";
import type { SurfaceSpec } from "@/lib/surfaces";

export type RichText = PortableTextBlock[];

export const PROJECT_TYPES = ["residential", "commercial"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_CATEGORIES = [
  "Living",
  "Kitchen",
  "Bedroom",
  "Office",
  "Retail",
  "Hospitality",
  "Villa",
  "Apartment",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface FloorPlanHotspot {
  /** Position on the plan in room metres (x: left→right, z: back→front). */
  x: number;
  z: number;
  label: string;
  /** Index into the project's gallery opened when the hotspot is clicked. */
  galleryIndex: number;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  type: ProjectType;
  category: ProjectCategory;
  clientType: string;
  location: string;
  /** sq.ft */
  area: number;
  year: number;
  duration: string;
  budgetRange: string;
  style: string;
  coverImage: ImageAsset;
  gallery: ImageAsset[];
  beforeAfter: { before: ImageAsset; after: ImageAsset };
  /** 3D scene: either a GLB url or a procedural layout + design. */
  model3D?: string;
  layout: LayoutId;
  design: DesignConfig;
  initialPreset: PresetId;
  floorPlan: FloorPlanHotspot[];
  /** Slugs of materials used. */
  materials: string[];
  description: RichText;
  featured: boolean;
}

export interface Service {
  slug: string;
  title: string;
  icon: "home" | "building" | "ruler" | "sofa" | "lamp" | "hammer";
  summary: string;
  description: string[];
  included: string[];
  process: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
  image: ImageAsset;
  /** Project categories used to pick sample projects. */
  sampleCategories: ProjectCategory[];
}

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio: string[];
  expertise: string[];
  /** Background tint for the monogram portrait placeholder. */
  tint: string;
  photo?: ImageAsset;
  socials: { name: string; href: string }[];
}

export const MATERIAL_CATEGORIES = [
  "Wood finishes",
  "Marble & stone",
  "Paint colors",
  "Flooring",
  "Fabrics & textures",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export interface Material {
  slug: string;
  name: string;
  category: MaterialCategory;
  origin: string;
  finish: string;
  description: string;
  useCases: string[];
  maintenance: string;
  /** Drives both the swatch thumbnail and the 3D preview sphere. */
  surface: SurfaceSpec;
}

export interface MoodBoard {
  slug: string;
  name: string;
  description: string;
  materials: string[];
  /** Applied when the board is sent to the 3D Studio. */
  design: DesignConfig;
}

export interface Testimonial {
  name: string;
  projectType: string;
  location: string;
  rating: number;
  quote: string;
  tint: string;
}

export interface Award {
  title: string;
  organisation: string;
  year: number;
  project?: string;
}

export const POST_CATEGORIES = [
  "Interior design trends",
  "Design tips",
  "Material guides",
  "Project stories",
  "Inspiration",
] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  /** ISO date */
  publishedAt: string;
  author: string; // team member slug
  coverImage: ImageAsset;
  body: RichText;
  featured: boolean;
}

export interface Milestone {
  year: number;
  title: string;
  text: string;
}
