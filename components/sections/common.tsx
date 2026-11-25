import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { ViewTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";
import { cn, formatArea, initials } from "@/lib/utils";

/** Title block for inner pages. Leaves room for the fixed header. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="container-page pt-32 pb-12 lg:pt-44 lg:pb-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 max-w-4xl text-5xl md:text-6xl lg:text-7xl">{title}</h1>
      {intro && <p className="text-fg-muted mt-6 max-w-2xl text-lg leading-relaxed">{intro}</p>}
      {children}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  action,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between lg:mb-14",
        className,
      )}
    >
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 max-w-2xl text-4xl md:text-5xl">{title}</h2>
        {intro && <p className="text-fg-muted mt-4 max-w-xl leading-relaxed">{intro}</p>}
      </div>
      {action}
    </div>
  );
}

/** Monogram portrait: an honest placeholder until real photography is added. */
export function Avatar({
  name,
  tint,
  className,
}: {
  name: string;
  tint: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center font-serif text-[#2b2926]", className)}
      style={{ backgroundColor: tint }}
      aria-hidden
    >
      <span className="text-[1.6em] tracking-wide">{initials(name)}</span>
    </div>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < value ? "fill-accent text-accent" : "text-border")}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ProjectCard({
  project,
  className,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  aspect = "aspect-[4/3]",
  eager = false,
}: {
  project: Project;
  className?: string;
  sizes?: string;
  aspect?: string;
  /** Load without waiting for the card to scroll near the viewport. */
  eager?: boolean;
}) {
  return (
    <Link href={`/projects/${project.slug}`} className={cn("group block", className)}>
      <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
        <div className={cn("bg-muted relative overflow-hidden rounded-sm", aspect)}>
          <Image
            src={project.coverImage.src}
            alt={project.coverImage.alt}
            fill
            sizes={sizes}
            loading={eager ? "eager" : "lazy"}
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          {/* hover / focus reveal */}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
            <p className="max-w-xs text-sm leading-relaxed text-white">{project.summary}</p>
            <ArrowUpRight className="ml-auto size-5 shrink-0 text-white" aria-hidden />
          </div>
        </div>
      </ViewTransition>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-2xl">{project.title}</h3>
        <span className="text-fg-muted text-sm tabular-nums">{project.year}</span>
      </div>
      <p className="text-fg-muted mt-1 text-sm">
        {project.location} · {formatArea(project.area)} · {project.style}
      </p>
    </Link>
  );
}

export function CtaBanner({
  title = "Let us design the rooms you will live in for years.",
  text = "Book a one-hour consultation at our studio or by video. Bring your plans, your references and your questions.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="container-page section" aria-labelledby="cta-title">
      <div className="bg-fg text-bg grid gap-10 rounded-sm px-6 py-14 md:px-14 lg:grid-cols-12 lg:items-end lg:py-20">
        <div className="lg:col-span-8">
          <p className="text-xs font-semibold tracking-[0.22em] uppercase opacity-70">
            Consultation
          </p>
          <h2 id="cta-title" className="mt-4 text-4xl md:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="mt-5 max-w-xl leading-relaxed opacity-80">{text}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
          <Button asChild size="lg" variant="accent">
            <Link href="/book">Book consultation</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border-bg/40 text-bg hover:bg-bg/10 border bg-transparent"
          >
            <Link href="/projects">See our projects</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * Placeholder for a detail page while its content loads. It mirrors the real
 * header block, so the page does not jump when the content arrives.
 */
export function DetailSkeleton({ media = false }: { media?: boolean }) {
  return (
    <div className="container-page min-h-dvh pt-28 lg:pt-36" role="status" aria-label="Loading">
      <div className="animate-pulse">
        <div className="bg-muted h-4 w-28 rounded-sm" />
        <div className="bg-muted mt-8 h-3 w-48 rounded-sm" />
        <div className="bg-muted mt-6 h-14 w-4/5 max-w-3xl rounded-sm md:h-20" />
        <div className="bg-muted mt-8 h-5 w-full max-w-2xl rounded-sm" />
        <div className="bg-muted mt-3 h-5 w-2/3 max-w-xl rounded-sm" />
        {media && (
          <div className="bg-muted mt-10 aspect-[4/3] w-full rounded-sm md:aspect-[16/9]" />
        )}
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <div className="bg-muted h-24 rounded-sm" />
          <div className="bg-muted h-24 rounded-sm" />
          <div className="bg-muted h-24 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
