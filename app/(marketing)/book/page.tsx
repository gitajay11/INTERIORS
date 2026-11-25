import type { Metadata } from "next";
import { BookingForm } from "@/components/forms/BookingForm";
import { QueryProvider } from "@/components/forms/QueryProvider";
import { PageHeader } from "@/components/sections/common";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Book a consultation",
  description:
    "Request a one-hour interior design consultation with Interiors, at our Chennai studio or by video call.",
  path: "/book",
});

export default function BookPage() {
  return (
    <PageTransition>
      <PageHeader
        eyebrow="Book a consultation"
        title="An hour with a designer."
        intro="Six short steps. Tell us about the space and choose a time; we will confirm within one working day."
      />
      <section className="container-page grid-12 gap-y-12 pb-24">
        <div className="col-span-12 lg:col-span-8">
          <QueryProvider>
            <BookingForm />
          </QueryProvider>
        </div>
        <aside className="col-span-12 lg:col-span-3 lg:col-start-10" aria-label="What to expect">
          <div className="lg:sticky lg:top-28">
            <h2 className="text-3xl">What to expect</h2>
            <ul className="text-fg-muted mt-5 space-y-4 text-[0.9375rem] leading-relaxed">
              <li>A one-hour conversation with a senior designer, free of charge.</li>
              <li>Bring floor plans, photographs and references if you have them.</li>
              <li>Within a week you receive a written scope, timeline and fee proposal.</li>
            </ul>
            <p className="border-border mt-8 border-t pt-6 text-sm">
              Prefer to talk first?
              <a
                href={`tel:${site.phoneHref}`}
                className="text-accent mt-1 block min-h-9 font-medium"
              >
                {site.phone}
              </a>
            </p>
          </div>
        </aside>
      </section>
    </PageTransition>
  );
}
