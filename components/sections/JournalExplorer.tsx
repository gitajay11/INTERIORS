"use client";

/** Journal index: category filter, search and pagination, all mirrored in the URL. */
import { useMemo, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { POST_CATEGORIES, type Post } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

/** An empty query string, for rendering the unfiltered view before the real one is known. */
const NO_PARAMS = new URLSearchParams() as unknown as ReadonlyURLSearchParams;

export const POSTS_PER_PAGE = 4;

export interface PostSummary extends Pick<
  Post,
  "slug" | "title" | "excerpt" | "category" | "publishedAt" | "coverImage" | "featured"
> {
  readingTime: number;
}

/** Pure filtering, exported for unit tests. */
export function filterPosts<T extends Pick<Post, "title" | "excerpt" | "category">>(
  posts: T[],
  filters: { category?: string; q?: string },
): T[] {
  const query = filters.q?.trim().toLowerCase();
  return posts.filter((post) => {
    if (filters.category && post.category !== filters.category) return false;
    if (query && !`${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(query))
      return false;
    return true;
  });
}

function Meta({ post }: { post: PostSummary }) {
  return (
    <p className="text-fg-muted text-sm">
      <span className="text-accent font-medium">{post.category}</span> ·{" "}
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {post.readingTime}{" "}
      min read
    </p>
  );
}

/**
 * The filters live in the query string, and reading it suspends during the
 * static prerender. Rather than ship a "Loading…" placeholder (which left the
 * grid out of the HTML and shifted the page once it arrived), the placeholder
 * is the unfiltered view itself. With no query string the two are identical,
 * so nothing moves when the live version takes over.
 */
export function JournalExplorer(props: { posts: PostSummary[] }) {
  return (
    <Suspense fallback={<JournalExplorerView {...props} params={NO_PARAMS} />}>
      <JournalExplorerLive {...props} />
    </Suspense>
  );
}

function JournalExplorerLive(props: { posts: PostSummary[] }) {
  return <JournalExplorerView {...props} params={useSearchParams()} />;
}

function JournalExplorerView({
  posts,
  params,
}: {
  posts: PostSummary[];
  params: ReadonlyURLSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const category = POST_CATEGORIES.find((c) => c === params.get("category"));
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const filtering = Boolean(category || q);

  const update = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // The featured article gets the hero slot, unless the visitor is filtering.
  const featured = filtering ? undefined : (posts.find((post) => post.featured) ?? posts[0]);
  const list = useMemo(
    () => filterPosts(posts, { category, q }).filter((post) => post.slug !== featured?.slug),
    [posts, category, q, featured],
  );
  const pages = Math.max(1, Math.ceil(list.length / POSTS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number(params.get("page")) || 1));
  const visible = list.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const chip = (selected: boolean) =>
    cn(
      "min-h-10 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
      selected ? "border-fg bg-fg text-bg" : "border-border hover:bg-muted",
    );

  return (
    <div>
      {featured && (
        <article className="mb-16">
          <Link href={`/journal/${featured.slug}`} className="group grid-12 items-center gap-y-6">
            <div className="bg-muted relative col-span-12 aspect-[3/2] overflow-hidden rounded-sm lg:col-span-8">
              <Image
                src={featured.coverImage.src}
                alt={featured.coverImage.alt}
                fill
                preload
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <p className="eyebrow mb-3">Featured</p>
              <Meta post={featured} />
              <h2 className="mt-3 text-4xl md:text-5xl">{featured.title}</h2>
              <p className="text-fg-muted mt-4 leading-relaxed">{featured.excerpt}</p>
              <span className="text-accent mt-5 inline-flex items-center gap-1.5 font-medium">
                Read article{" "}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </div>
          </Link>
        </article>
      )}

      <div className="border-border flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0"
          role="group"
          aria-label="Filter by category"
        >
          <button
            type="button"
            className={chip(!category)}
            aria-pressed={!category}
            onClick={() => update({ category: undefined, page: undefined })}
          >
            All
          </button>
          {POST_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={chip(category === c)}
              aria-pressed={category === c}
              onClick={() => update({ category: category === c ? undefined : c, page: undefined })}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="relative block shrink-0">
          <span className="sr-only">Search the journal</span>
          <Search
            className="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              update({ q: event.target.value || undefined, page: undefined });
            }}
            placeholder="Search articles"
            className="border-border bg-surface focus-visible:border-accent h-11 w-full rounded-sm border pr-3 pl-9 text-sm lg:w-64"
          />
        </label>
      </div>

      <p className="text-fg-muted mt-5 text-sm" role="status" aria-live="polite">
        {list.length} {list.length === 1 ? "article" : "articles"}
        {pages > 1 && ` · page ${page} of ${pages}`}
      </p>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl">Nothing matches that search.</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.replace(pathname, { scroll: false });
            }}
            className="text-accent mt-4 min-h-11 font-medium underline underline-offset-4"
          >
            Show all articles
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {visible.map((post) => (
            <li key={post.slug}>
              <Link href={`/journal/${post.slug}`} className="group block">
                <div className="bg-muted relative aspect-[3/2] overflow-hidden rounded-sm">
                  <Image
                    src={post.coverImage.src}
                    alt={post.coverImage.alt}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                  />
                </div>
                <div className="mt-5">
                  <Meta post={post} />
                  <h2 className="mt-2 text-3xl">{post.title}</h2>
                  <p className="text-fg-muted mt-2 leading-relaxed">{post.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            type="button"
            onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : undefined })}
            disabled={page === 1}
            className="border-border hover:bg-muted flex size-11 items-center justify-center rounded-full border disabled:opacity-40"
            aria-label="Previous page"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => update({ page: number > 1 ? String(number) : undefined })}
              aria-current={number === page ? "page" : undefined}
              aria-label={`Page ${number}`}
              className={cn(
                "flex size-11 items-center justify-center rounded-full text-sm tabular-nums",
                number === page ? "bg-fg text-bg" : "hover:bg-muted",
              )}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            onClick={() => update({ page: String(page + 1) })}
            disabled={page === pages}
            className="border-border hover:bg-muted flex size-11 items-center justify-center rounded-full border disabled:opacity-40"
            aria-label="Next page"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
