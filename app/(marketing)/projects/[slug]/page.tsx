import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { BeforeAfter } from "@/components/projects/BeforeAfter";
import { ProjectMedia } from "@/components/projects/ProjectMedia";
import { ShareProject } from "@/components/projects/ShareProject";
import {
  CtaBanner,
  DetailSkeleton,
  ProjectCard,
  SectionHeading,
} from "@/components/sections/common";
import { RichTextBody } from "@/components/sections/RichTextBody";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { SwatchCanvas } from "@/components/ui/SwatchCanvas";
import { getMaterials, getProject, getProjects } from "@/lib/content";
import { breadcrumbJsonLd, pageMetadata, projectJsonLd } from "@/lib/seo";
import { formatArea } from "@/lib/utils";
import { PageTransition } from "@/components/layout/PageTransition";

type Props = PageProps<"/projects/[slug]">;

// Prerender every known project at build time.
export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return pageMetadata({
    title: `${project.title}, ${project.location}`,
    description: project.summary,
    path: `/projects/${project.slug}`,
    image: project.coverImage.src,
  });
}

export default function ProjectPage(props: Props) {
  return (
    <PageTransition>
      <Suspense fallback={<DetailSkeleton media />}>
        <ProjectContent {...props} />
      </Suspense>
    </PageTransition>
  );
}

async function ProjectContent({ params }: Props) {
  const { slug } = await params;
  const [project, projects, materials] = await Promise.all([
    getProject(slug),
    getProjects(),
    getMaterials(),
  ]);
  if (!project) notFound();

  const used = project.materials
    .map((materialSlug) => materials.find((material) => material.slug === materialSlug))
    .filter((material) => material !== undefined);
  const related = projects
    .filter((other) => other.slug !== project.slug)
    .sort(
      (a, b) =>
        Number(b.category === project.category) - Number(a.category === project.category) ||
        Number(b.type === project.type) - Number(a.type === project.type),
    )
    .slice(0, 3);

  const facts = [
    ["Client", project.clientType],
    ["Location", project.location],
    ["Area", formatArea(project.area)],
    ["Duration", project.duration],
    ["Budget", project.budgetRange],
    ["Style", project.style],
  ];

  return (
    <article>
      <JsonLd data={projectJsonLd(project)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ])}
      />

      {/* ---- Hero ---- */}
      <header className="container-page pt-28 lg:pt-36">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/projects"
            className="text-fg-muted hover:text-fg inline-flex min-h-11 items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden /> All projects
          </Link>
          <ShareProject
            title={project.title}
            summary={project.summary}
            slug={project.slug}
            image={project.coverImage.src}
          />
        </div>
        <p className="eyebrow mt-6">
          {project.type} · {project.category} · {project.year}
        </p>
        <h1 className="mt-4 text-5xl md:text-7xl lg:text-8xl">{project.title}</h1>
        <p className="text-fg-muted mt-6 max-w-2xl text-xl leading-relaxed">{project.summary}</p>
      </header>
      <div className="container-page mt-10">
        {/* Same name as the card that led here, so the image grows into place. */}
        <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
          <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-sm md:aspect-[16/9]">
            <Image
              src={project.coverImage.src}
              alt={project.coverImage.alt}
              fill
              preload
              sizes="(min-width: 1344px) 1264px, 100vw"
              className="object-cover"
            />
          </div>
        </ViewTransition>
      </div>

      {/* ---- Facts + description ---- */}
      <section className="container-page section">
        <div className="grid-12 gap-y-12">
          <dl className="border-border col-span-12 grid grid-cols-2 gap-x-6 gap-y-6 self-start border-t pt-8 lg:col-span-4">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="text-fg-muted text-xs font-semibold tracking-[0.18em] uppercase">
                  {label}
                </dt>
                <dd className="mt-1.5 font-serif text-xl">{value}</dd>
              </div>
            ))}
          </dl>
          <RichTextBody
            value={project.description}
            className="col-span-12 lg:col-span-7 lg:col-start-6"
          />
        </div>
      </section>

      {/* ---- Gallery ---- */}
      <ProjectMedia gallery={project.gallery} />

      {/* ---- Materials ---- */}
      {used.length > 0 && (
        <section className="bg-muted section" aria-labelledby="materials-title">
          <div className="container-page">
            <SectionHeading
              eyebrow="Materials"
              title={<span id="materials-title">What it is made of</span>}
              intro="Select a material to read about its origin, finish and care."
            />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {used.map((material) => (
                <li key={material.slug}>
                  <Link href={`/materials?material=${material.slug}`} className="group block">
                    <div className="border-border aspect-square overflow-hidden rounded-sm border">
                      <SwatchCanvas
                        surface={material.surface}
                        size={192}
                        className="transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <p className="mt-3 font-serif text-lg">{material.name}</p>
                    <p className="text-fg-muted text-sm">{material.category}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ---- Before / after ---- */}
      <section className="container-page section" aria-labelledby="before-after-title">
        <SectionHeading
          eyebrow="Before & after"
          title={<span id="before-after-title">From bare shell to finished room</span>}
          intro="Drag the handle, or use the arrow keys, to compare."
        />
        <BeforeAfter before={project.beforeAfter.before} after={project.beforeAfter.after} />
      </section>

      {/* ---- Contextual project CTA ---- */}
      <section
        className="bg-muted border-border border-t py-16 lg:py-20"
        aria-labelledby="project-cta-title"
      >
        <div className="container-page">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">Your space</p>
              <h2 id="project-cta-title" className="mt-3 text-3xl md:text-4xl">
                Inspired by {project.title}?
              </h2>
              <p className="text-fg-muted mt-3 leading-relaxed">
                Every space we create is tailored to its occupants. Book a consultation to discuss
                your layout, materials, and vision.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button asChild size="lg" variant="accent">
                <Link href="/book">Book consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Related ---- */}
      <section
        className="bg-surface border-border section border-t"
        aria-labelledby="related-title"
      >
        <div className="container-page">
          <SectionHeading
            eyebrow="More work"
            title={<span id="related-title">Related projects</span>}
          />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <li key={other.slug}>
                <ProjectCard project={other} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBanner title="Have a room like this in mind?" />
    </article>
  );
}
