import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBanner, PageHeader, SectionHeading } from "@/components/sections/common";
import { MaterialsExplorer } from "@/components/sections/MaterialsExplorer";
import { Button } from "@/components/ui/button";
import { SwatchCanvas } from "@/components/ui/SwatchCanvas";
import { getMaterials, getMoodBoards } from "@/lib/content";
import { encodeConfig } from "@/lib/design-config";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Materials & finishes",
  description:
    "Our materials library: wood finishes, marble and stone, paint colours, flooring and fabrics, with origin, finish, use cases and care for each.",
  path: "/materials",
});

export default async function MaterialsPage() {
  const [materials, boards] = await Promise.all([getMaterials(), getMoodBoards()]);

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Materials & finishes"
        title="The library behind every room."
        intro="A working selection from the two thousand samples in our studio. Select a swatch for its origin, finish and care, and to turn it in the light."
      />
      <section className="container-page pb-20" aria-label="Material swatches">
        <MaterialsExplorer materials={materials} />
      </section>

      <section className="bg-surface border-border section border-y" aria-labelledby="boards-title">
        <div className="container-page">
          <SectionHeading
            eyebrow="Material combinations"
            title={<span id="boards-title">Curated mood boards</span>}
            intro="Three palettes we return to often. Send one to the 3D Studio to see it in a room."
          />
          <ul className="grid gap-8 lg:grid-cols-3">
            {boards.map((board) => {
              const swatches = board.materials
                .map((slug) => materials.find((material) => material.slug === slug))
                .filter((material) => material !== undefined);
              const query = encodeConfig(board.design, true);
              return (
                <li
                  key={board.slug}
                  className="border-border bg-bg flex flex-col rounded-sm border p-6"
                >
                  {/* collage: one large swatch and four small ones */}
                  <div className="grid aspect-[4/3] grid-cols-4 grid-rows-2 gap-1.5">
                    {swatches.map((material, index) => (
                      <div
                        key={material.slug}
                        title={material.name}
                        className={
                          index === 0
                            ? "col-span-2 row-span-2 overflow-hidden rounded-sm"
                            : "overflow-hidden rounded-sm"
                        }
                      >
                        <SwatchCanvas surface={material.surface} size={index === 0 ? 256 : 128} />
                      </div>
                    ))}
                  </div>
                  <h3 className="mt-6 text-3xl">{board.name}</h3>
                  <p className="text-fg-muted mt-2 flex-1 leading-relaxed">{board.description}</p>
                  <ul className="text-fg-muted mt-4 text-sm">
                    {swatches.map((material) => (
                      <li
                        key={material.slug}
                        className="inline after:mx-1.5 after:content-['·'] last:after:hidden"
                      >
                        <Link
                          href={`/materials?material=${material.slug}`}
                          className="hover:text-accent underline-offset-4 hover:underline"
                        >
                          {material.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 self-start">
                    <Link href={`/studio?${query}`}>
                      Send to 3D Studio <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <CtaBanner
        title="Feel the samples in person."
        text="Our materials library is open to clients by appointment, six days a week."
      />
    </PageTransition>
  );
}
