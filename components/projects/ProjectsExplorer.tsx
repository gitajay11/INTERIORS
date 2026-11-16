"use client";

/**
 * Portfolio grid with URL-synced filters.
 *
 * The query string is the single source of truth (?type=&category=&q=&sort=),
 * so filtered views can be bookmarked, shared and reached from the mega menu.
 */
import { ViewTransition, useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { PROJECT_CATEGORIES, PROJECT_TYPES, type Project } from "@/lib/types";
import { cn, formatArea } from "@/lib/utils";

/** An empty query string, for rendering the unfiltered view before the real one is known. */
const NO_PARAMS = new URLSearchParams() as unknown as ReadonlyURLSearchParams;

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "area-desc", label: "Area: largest first" },
  { value: "area-asc", label: "Area: smallest first" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

/** Pure filtering + sorting, exported for unit tests. */
export function filterProjects(
  projects: Project[],
  filters: { type?: string; category?: string; q?: string; sort?: string },
): Project[] {
  const query = filters.q?.trim().toLowerCase();
  const result = projects.filter((project) => {
    if (filters.type && project.type !== filters.type) return false;
    if (filters.category && project.category !== filters.category) return false;
    if (query) {
      const haystack =
        `${project.title} ${project.location} ${project.style} ${project.category} ${project.summary}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
  const sort = filters.sort as Sort | undefined;
  return result.sort((a, b) => {
    if (sort === "area-desc") return b.area - a.area;
    if (sort === "area-asc") return a.area - b.area;
    return b.year - a.year || a.title.localeCompare(b.title);
  });
}

// Alternating heights give the masonry its rhythm.
const ASPECTS = [
  "aspect-[4/5]",
  "aspect-[4/3]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[4/5]",
  "aspect-[3/2]",
];

/**
 * The filters live in the query string, and reading it suspends during the
 * static prerender. Rather than ship a "Loading…" placeholder (which left the
 * grid out of the HTML and shifted the page once it arrived), the placeholder
 * is the unfiltered view itself. With no query string the two are identical,
 * so nothing moves when the live version takes over.
 */
export function ProjectsExplorer(props: { projects: Project[] }) {
  return (
    <Suspense fallback={<ProjectsExplorerView {...props} params={NO_PARAMS} />}>
      <ProjectsExplorerLive {...props} />
    </Suspense>
  );
}

function ProjectsExplorerLive(props: { projects: Project[] }) {
  return <ProjectsExplorerView {...props} params={useSearchParams()} />;
}

function ProjectsExplorerView({
  projects,
  params,
}: {
  projects: Project[];
  params: ReadonlyURLSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const type = PROJECT_TYPES.find((t) => t === params.get("type"));
  const category = PROJECT_CATEGORIES.find((c) => c === params.get("category"));
  const q = params.get("q") ?? "";
  // Local copy keeps typing responsive while the URL catches up.
  const [search, setSearch] = useState(q);
  const sort = SORTS.find((s) => s.value === params.get("sort"))?.value ?? "newest";

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const visible = useMemo(
    () => filterProjects(projects, { type, category, q, sort }),
    [projects, type, category, q, sort],
  );

  // Only offer categories that exist for the selected type.
  const categories = PROJECT_CATEGORIES.filter((c) =>
    projects.some((project) => project.category === c && (!type || project.type === type)),
  );

  const chip = (selected: boolean) =>
    cn(
      "min-h-10 rounded-full border px-4 text-sm transition-colors",
      selected ? "border-fg bg-fg text-bg" : "border-border hover:bg-muted",
    );

  return (
    <div>
      <div className="border-border flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="flex gap-6" role="tablist" aria-label="Project type">
            {[
              { value: undefined, label: "All" },
              ...PROJECT_TYPES.map((t) => ({ value: t, label: t })),
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={type === tab.value}
                onClick={() => setParam("type", tab.value)}
                className={cn(
                  "min-h-11 border-b-2 font-serif text-2xl capitalize transition-colors",
                  type === tab.value
                    ? "border-accent"
                    : "text-fg-muted hover:text-fg border-transparent",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by space">
            <button
              type="button"
              className={chip(!category)}
              aria-pressed={!category}
              onClick={() => setParam("category", undefined)}
            >
              All spaces
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={chip(category === c)}
                aria-pressed={category === c}
                onClick={() => setParam("category", category === c ? undefined : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <span className="sr-only">Search projects</span>
            <Search
              className="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setParam("q", event.target.value || undefined);
              }}
              placeholder="Search by name, city or style"
              className="border-border bg-surface focus-visible:border-accent h-11 w-full rounded-sm border pr-3 pl-9 text-sm sm:w-64"
            />
          </label>
          <label>
            <span className="sr-only">Sort projects</span>
            <select
              value={sort}
              onChange={(event) =>
                setParam("sort", event.target.value === "newest" ? undefined : event.target.value)
              }
              className="border-border bg-surface focus-visible:border-accent h-11 w-full rounded-sm border px-3 text-sm"
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="text-fg-muted mt-5 text-sm" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? "project" : "projects"}
      </p>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl">No projects match those filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.replace(pathname, { scroll: false });
            }}
            className="text-accent mt-4 min-h-11 font-medium underline underline-offset-4"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ul className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((project, index) => (
              <motion.li
                key={project.slug}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 break-inside-avoid"
              >
                <Link href={`/projects/${project.slug}`} className="group block">
                  <ViewTransition name={`project-${project.slug}`} share="morph" default="none">
                    <div
                      className={cn(
                        "bg-muted relative overflow-hidden rounded-sm",
                        ASPECTS[index % ASPECTS.length],
                      )}
                    >
                      <Image
                        src={project.coverImage.src}
                        alt={project.coverImage.alt}
                        fill
                        loading={index < 3 ? "eager" : "lazy"}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                      />
                      <span className="bg-surface/90 absolute top-3 left-3 rounded-sm px-2.5 py-1 text-xs font-medium backdrop-blur">
                        {project.category}
                      </span>
                    </div>
                  </ViewTransition>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h2 className="text-2xl">{project.title}</h2>
                    <span className="text-fg-muted text-sm tabular-nums">{project.year}</span>
                  </div>
                  <p className="text-fg-muted mt-1 text-sm">
                    {project.location} · {formatArea(project.area)} · {project.style}
                  </p>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
