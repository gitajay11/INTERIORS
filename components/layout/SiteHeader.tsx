import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { getFeaturedProjects, getServices } from "@/lib/content";

/** Server wrapper: loads the mega-menu content and hands it to the client header. */
export async function SiteHeader() {
  const [services, featured] = await Promise.all([getServices(), getFeaturedProjects()]);
  return (
    // Header reads the pathname; Suspense keeps it out of the shared app shell.
    // No placeholder: the header is fixed, so an in-flow one would shift the page when it is replaced.
    <Suspense fallback={null}>
      <Header
        services={services.map(({ slug, title, summary }) => ({ slug, title, summary }))}
        featured={featured.map((project) => ({
          slug: project.slug,
          title: project.title,
          location: project.location,
          image: project.coverImage,
        }))}
      />
    </Suspense>
  );
}
