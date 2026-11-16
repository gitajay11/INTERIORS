import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Check } from "lucide-react";
import {
  CtaBanner,
  DetailSkeleton,
  ProjectCard,
  SectionHeading,
} from "@/components/sections/common";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { serviceIcons } from "@/components/sections/service-icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { getProjects, getService, getServices } from "@/lib/content";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

type Props = PageProps<"/services/[slug]">;

export async function generateStaticParams() {
  return (await getServices()).map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service not found" };
  return pageMetadata({
    title: service.title,
    description: service.summary,
    path: `/services/${service.slug}`,
    image: service.image.src,
  });
}

export default function ServicePage(props: Props) {
  return (
    <PageTransition>
      <Suspense fallback={<DetailSkeleton />}>
        <ServiceContent {...props} />
      </Suspense>
    </PageTransition>
  );
}

async function ServiceContent({ params }: Props) {
  const { slug } = await params;
  const [service, projects] = await Promise.all([getService(slug), getProjects()]);
  if (!service) notFound();

  const Icon = serviceIcons[service.icon];
  const samples = projects
    .filter((project) => service.sampleCategories.includes(project.category))
    .slice(0, 3);

  return (
    <article>
      <JsonLd data={faqJsonLd(service.faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />

      <header className="container-page pt-28 lg:pt-36">
        <Link
          href="/services"
          className="text-fg-muted hover:text-fg inline-flex min-h-11 items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> All services
        </Link>
        <div className="grid-12 mt-6 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-7">
            <Icon className="text-accent size-9" strokeWidth={1.25} aria-hidden />
            <h1 className="mt-5 text-5xl md:text-7xl">{service.title}</h1>
            <p className="text-fg-muted mt-5 max-w-xl text-xl leading-relaxed">{service.summary}</p>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:text-right">
            <Button asChild size="lg" variant="accent">
              <Link href="/book">Book a consultation</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-page mt-12">
        <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-sm md:aspect-[21/9]">
          <Image
            src={service.image.src}
            alt={service.image.alt}
            fill
            preload
            sizes="(min-width: 1344px) 1264px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* ---- Description + what's included ---- */}
      <section className="container-page section">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 space-y-5 text-lg leading-relaxed lg:col-span-6">
            {service.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="bg-surface border-border col-span-12 rounded-sm border p-8 lg:col-span-5 lg:col-start-8">
            <h2 className="text-3xl">What is included</h2>
            <ul className="mt-6 space-y-3.5">
              {service.included.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="text-accent mt-1 size-4 shrink-0" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Process ---- */}
      <section className="bg-muted section" aria-labelledby="process-title">
        <div className="container-page">
          <SectionHeading eyebrow="Process" title={<span id="process-title">How it works</span>} />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {service.process.map((step, index) => (
              <li key={step.title} className="border-fg/20 border-t pt-5">
                <p className="text-accent text-sm font-semibold tabular-nums">0{index + 1}</p>
                <h3 className="mt-2 text-2xl">{step.title}</h3>
                <p className="text-fg-muted mt-2 text-[0.9375rem] leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Sample projects ---- */}
      {samples.length > 0 && (
        <section className="container-page section" aria-labelledby="samples-title">
          <SectionHeading
            eyebrow="Sample projects"
            title={<span id="samples-title">This service at work</span>}
          />
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {samples.map((project) => (
              <li key={project.slug}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- FAQs ---- */}
      <section className="bg-surface border-border section border-y" aria-labelledby="faq-title">
        <div className="container-page grid-12 gap-y-8">
          <div className="col-span-12 lg:col-span-4">
            <p className="eyebrow">FAQs</p>
            <h2 id="faq-title" className="mt-3 text-4xl md:text-5xl">
              Questions we are often asked
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <FaqAccordion faqs={service.faqs} />
          </div>
        </div>
      </section>

      <CtaBanner title={`Talk to us about ${service.title.toLowerCase()}.`} />
    </article>
  );
}
