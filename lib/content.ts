"use cache";

/**
 * Content access layer.
 *
 * Every page reads content through these functions rather than importing
 * lib/data directly, so the source can change later (a CMS, a database)
 * without touching the pages.
 *
 * The whole module is cached ("use cache"): results are part of the static
 * shell and are revalidated in the background on the `hours` profile, which is
 * how the App Router expresses ISR with Cache Components.
 */
import { cacheLife } from "next/cache";
import { materials, moodBoards } from "@/lib/data/materials";
import { posts } from "@/lib/data/posts";
import { projects } from "@/lib/data/projects";
import { services } from "@/lib/data/services";
import { awards, team, testimonials } from "@/lib/data/studio";
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
export async function getProjects(): Promise<Project[]> {
  cacheLife("hours");
  return projects;
}

export async function getProject(slug: string): Promise<Project | null> {
  cacheLife("hours");
  return projects.find((project) => project.slug === slug) ?? null;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  cacheLife("hours");
  return projects.filter((project) => project.featured);
}

// ---- Services ---------------------------------------------------------------
export async function getServices(): Promise<Service[]> {
  cacheLife("hours");
  return services;
}

export async function getService(slug: string): Promise<Service | null> {
  cacheLife("hours");
  return services.find((service) => service.slug === slug) ?? null;
}

// ---- Team, testimonials, awards --------------------------------------------
export async function getTeam(): Promise<TeamMember[]> {
  cacheLife("hours");
  return team;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  cacheLife("hours");
  return testimonials;
}

export async function getAwards(): Promise<Award[]> {
  cacheLife("hours");
  return awards;
}

// ---- Materials --------------------------------------------------------------
export async function getMaterials(): Promise<Material[]> {
  cacheLife("hours");
  return materials;
}

export async function getMoodBoards(): Promise<MoodBoard[]> {
  cacheLife("hours");
  return moodBoards;
}

// ---- Journal ----------------------------------------------------------------
export async function getPosts(): Promise<Post[]> {
  cacheLife("hours");
  return posts;
}

export async function getPost(slug: string): Promise<Post | null> {
  cacheLife("hours");
  return posts.find((post) => post.slug === slug) ?? null;
}
