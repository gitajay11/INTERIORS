"use client";

/**
 * Materials library: category tabs, swatch grid and a detail drawer with a
 * large swatch. The open material is mirrored in `?material=`, so
 * project pages can link straight to a swatch.
 */
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";
import { useState, Suspense } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/primitives";
import { SwatchCanvas } from "@/components/ui/SwatchCanvas";
import { MATERIAL_CATEGORIES, type Material, type MaterialCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

/** An empty query string, for rendering the unfiltered view before the real one is known. */
const NO_PARAMS = new URLSearchParams() as unknown as ReadonlyURLSearchParams;

/**
 * The filters live in the query string, and reading it suspends during the
 * static prerender. Rather than ship a "Loading…" placeholder (which left the
 * grid out of the HTML and shifted the page once it arrived), the placeholder
 * is the unfiltered view itself. With no query string the two are identical,
 * so nothing moves when the live version takes over.
 */
export function MaterialsExplorer(props: { materials: Material[] }) {
  return (
    <Suspense fallback={<MaterialsExplorerView {...props} params={NO_PARAMS} />}>
      <MaterialsExplorerLive {...props} />
    </Suspense>
  );
}

function MaterialsExplorerLive(props: { materials: Material[] }) {
  return <MaterialsExplorerView {...props} params={useSearchParams()} />;
}

function MaterialsExplorerView({
  materials,
  params,
}: {
  materials: Material[];
  params: ReadonlyURLSearchParams;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState<MaterialCategory | "All">("All");

  const selected = materials.find((material) => material.slug === params.get("material")) ?? null;
  const visible =
    category === "All" ? materials : materials.filter((material) => material.category === category);

  const open = (slug: string | null) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("material", slug);
    else next.delete("material");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <>
      <div
        className="border-border no-scrollbar -mx-5 flex gap-1 overflow-x-auto border-b px-5 md:mx-0 md:px-0"
        role="tablist"
        aria-label="Material categories"
      >
        {(["All", ...MATERIAL_CATEGORIES] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={category === item}
            onClick={() => setCategory(item)}
            className={cn(
              "-mb-px min-h-12 shrink-0 border-b-2 px-4 text-sm font-medium whitespace-nowrap transition-colors",
              category === item
                ? "border-accent text-fg"
                : "text-fg-muted hover:text-fg border-transparent",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-fg-muted mt-5 text-sm" role="status" aria-live="polite">
        {visible.length} materials
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((material) => (
          <li key={material.slug}>
            <button
              type="button"
              onClick={() => open(material.slug)}
              className="group block w-full text-left"
              aria-haspopup="dialog"
            >
              <span className="border-border block aspect-square overflow-hidden rounded-sm border">
                <SwatchCanvas
                  surface={material.surface}
                  size={192}
                  className="transition-transform duration-700 group-hover:scale-110"
                />
              </span>
              <span className="mt-3 block font-serif text-xl">{material.name}</span>
              <span className="text-fg-muted block text-sm">
                {material.category} · {material.origin}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={selected !== null} onOpenChange={(next) => !next && open(null)}>
        <DialogContent side="right" className="p-6 pt-16 sm:p-8 sm:pt-16">
          {selected && (
            <>
              <div className="border-border aspect-square overflow-hidden rounded-sm border">
                <SwatchCanvas surface={selected.surface} size={512} />
              </div>
              <p className="eyebrow mt-7">{selected.category}</p>
              <DialogTitle className="mt-2 font-serif text-4xl">{selected.name}</DialogTitle>
              <DialogDescription className="text-fg-muted mt-3 leading-relaxed">
                {selected.description}
              </DialogDescription>
              <dl className="border-border mt-6 divide-y divide-[var(--border)] border-y">
                {[
                  ["Origin", selected.origin],
                  ["Finish", selected.finish],
                  ["Use cases", selected.useCases.join(", ")],
                  ["Maintenance", selected.maintenance],
                ].map(([term, detail]) => (
                  <div key={term} className="grid grid-cols-3 gap-4 py-3.5">
                    <dt className="text-fg-muted text-xs font-semibold tracking-[0.16em] uppercase">
                      {term}
                    </dt>
                    <dd className="col-span-2 text-[0.9375rem] leading-relaxed">{detail}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
