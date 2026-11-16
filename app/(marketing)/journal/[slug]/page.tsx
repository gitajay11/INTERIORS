import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Avatar, CtaBanner, DetailSkeleton } from "@/components/sections/common";
import { RichTextBody } from "@/components/sections/RichTextBody";
import { ShareButtons } from "@/components/sections/ShareButtons";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPost, getPosts, getTeam } from "@/lib/content";
import { headings, readingTime } from "@/lib/data/rich-text";
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/layout/PageTransition";

type Props = PageProps<"/journal/[slug]">;

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  const base = pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/journal/${post.slug}`,
    image: post.coverImage.src,
  });
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      section: post.category,
    },
  };
}

export default function ArticlePage(props: Props) {
  return (
    <PageTransition>
      <Suspense fallback={<DetailSkeleton media />}>
        <ArticleContent {...props} />
      </Suspense>
    </PageTransition>
  );
}

async function ArticleContent({ params }: Props) {
  const { slug } = await params;
  const [post, posts, team] = await Promise.all([getPost(slug), getPosts(), getTeam()]);
  if (!post) notFound();

  const author = team.find((member) => member.slug === post.author);
  const toc = headings(post.body);
  const minutes = readingTime(post.body);
  const related = posts
    .filter((other) => other.slug !== post.slug)
    .sort((a, b) => Number(b.category === post.category) - Number(a.category === post.category))
    .slice(0, 3);

  return (
    <article>
      <JsonLd data={articleJsonLd(post, author)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/journal" },
          { name: post.title, path: `/journal/${post.slug}` },
        ])}
      />

      <header className="container-page pt-28 lg:pt-36">
        <Link
          href="/journal"
          className="text-fg-muted hover:text-fg inline-flex min-h-11 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Journal
        </Link>
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <p className="eyebrow">{post.category}</p>
          <h1 className="mt-4 text-5xl md:text-6xl lg:text-7xl">{post.title}</h1>
          <p className="text-fg-muted mt-6 text-sm">
            {author && <>By {author.name} · </>}
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · {minutes} min
            read
          </p>
        </div>
      </header>

      <div className="container-page mt-10">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-sm md:aspect-[21/9]">
          <Image
            src={post.coverImage.src}
            alt={post.coverImage.alt}
            fill
            preload
            sizes="(min-width: 1344px) 1264px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="container-page grid-12 gap-y-10 py-16 lg:py-24">
        {/* ---- Table of contents ---- */}
        {toc.length > 0 && (
          <nav className="col-span-12 lg:col-span-3" aria-label="Table of contents">
            <div className="lg:sticky lg:top-28">
              <p className="eyebrow mb-3">In this article</p>
              <ol className="border-border space-y-0.5 border-l">
                {toc.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className={`text-fg-muted hover:border-accent hover:text-fg -ml-px flex min-h-9 items-center border-l border-transparent text-sm transition-colors ${heading.level === 3 ? "pl-8" : "pl-4"}`}
                    >
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        )}

        {/* ---- Body ---- */}
        <div className="col-span-12 lg:col-span-7 lg:col-start-5">
          <p className="mb-8 font-serif text-2xl leading-snug md:text-3xl">{post.excerpt}</p>
          <RichTextBody value={post.body} />

          <div className="border-border mt-14 border-t pt-8">
            <p className="mb-3 text-sm font-medium">Share</p>
            <ShareButtons url={`${site.url}/journal/${post.slug}`} title={post.title} />
          </div>

          {/* ---- Author card ---- */}
          {author && (
            <aside
              className="bg-surface border-border mt-10 flex gap-5 rounded-sm border p-6"
              aria-label="About the author"
            >
              <Avatar
                name={author.name}
                tint={author.tint}
                className="size-16 shrink-0 rounded-full text-sm"
              />
              <div>
                <p className="font-serif text-2xl">{author.name}</p>
                <p className="text-accent text-sm font-medium">{author.role}</p>
                <p className="text-fg-muted mt-2 text-[0.9375rem] leading-relaxed">
                  {author.bio[0]}
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ---- Related ---- */}
      <section
        className="bg-surface border-border section border-t"
        aria-labelledby="related-title"
      >
        <div className="container-page">
          <p className="eyebrow">Keep reading</p>
          <h2 id="related-title" className="mt-3 mb-10 text-4xl md:text-5xl">
            Related articles
          </h2>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((other) => (
              <li key={other.slug}>
                <Link href={`/journal/${other.slug}`} className="group block">
                  <div className="bg-muted relative aspect-[3/2] overflow-hidden rounded-sm">
                    <Image
                      src={other.coverImage.src}
                      alt={other.coverImage.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  </div>
                  <p className="text-accent mt-4 text-sm font-medium">{other.category}</p>
                  <h3 className="mt-1 text-2xl">{other.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBanner />
    </article>
  );
}
