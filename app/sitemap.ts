import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services, posts] = await Promise.all([getProjects(), getServices(), getPosts()]);
  const url = (path: string) => `${site.url}${path}`;

  const pages: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "monthly", priority: 1 },
    { url: url("/about"), changeFrequency: "yearly", priority: 0.7 },
    { url: url("/projects"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/services"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/studio"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/materials"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/journal"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/book"), changeFrequency: "yearly", priority: 0.8 },
    { url: url("/contact"), changeFrequency: "yearly", priority: 0.6 },
  ];

  return [
    ...pages,
    ...projects.map((project) => ({
      url: url(`/projects/${project.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...services.map((service) => ({
      url: url(`/services/${service.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: url(`/journal/${post.slug}`),
      lastModified: post.publishedAt,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
