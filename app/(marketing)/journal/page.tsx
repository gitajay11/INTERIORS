import type { Metadata } from "next";
import { PageHeader } from "@/components/sections/common";
import { JournalExplorer } from "@/components/sections/JournalExplorer";
import { getPosts } from "@/lib/content";
import { readingTime } from "@/lib/data/rich-text";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Journal",
  description:
    "Interior design trends, practical tips, material guides, project stories and inspiration from the Interiors studio.",
  path: "/journal",
});

export default async function JournalPage() {
  const posts = await getPosts();
  // Send only what the index needs to the client (no article bodies).
  const summaries = posts.map(({ body, author: _author, ...post }) => ({
    ...post,
    readingTime: readingTime(body),
  }));

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Journal"
        title="Notes from the studio."
        intro="What we are learning, choosing and building: trends worth keeping, materials worth knowing and the stories behind our projects."
      />
      <section className="container-page pb-24" aria-label="Articles">
        <JournalExplorer posts={summaries} />
      </section>
    </PageTransition>
  );
}
