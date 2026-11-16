import type { Metadata } from "next";
import Link from "next/link";
import { BeforeAfter } from "@/components/projects/BeforeAfter";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { CtaBanner, PageHeader, SectionHeading } from "@/components/sections/common";
import { getProjects } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description:
    "Residential and commercial interiors by Interiors, Chennai: living rooms, kitchens, bedrooms, offices, boutiques and restaurants across India.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await getProjects();
  const transformation =
    projects.find((project) => project.slug === "besant-nagar-suite") ?? projects[0];

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Portfolio"
        title="Homes and workplaces, made with care."
        intro="A selection of recent residential and commercial work. Filter by type or space, or search for a city or style."
      />
      <section className="container-page pb-20" aria-label="Project gallery">
        <ProjectsExplorer projects={projects} />
      </section>

      <section className="bg-surface section border-border border-y">
        <div className="container-page">
          <SectionHeading
            eyebrow="Before & after"
            title="The same room, twelve weeks apart"
            intro={
              <>
                Drag the handle to compare the bare shell with the finished{" "}
                <Link
                  href={`/projects/${transformation.slug}`}
                  className="text-accent underline underline-offset-4"
                >
                  {transformation.title}
                </Link>
                .
              </>
            }
          />
          <BeforeAfter
            before={transformation.beforeAfter.before}
            after={transformation.beforeAfter.after}
          />
        </div>
      </section>
      <CtaBanner />
    </PageTransition>
  );
}
