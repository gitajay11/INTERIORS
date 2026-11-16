import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBanner, PageHeader } from "@/components/sections/common";
import { Reveal } from "@/components/sections/motion";
import { serviceIcons } from "@/components/sections/service-icons";
import { getServices } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Services",
  description:
    "Residential and commercial interiors, space planning, furniture selection, lighting design, and renovation by Interiors, Chennai.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <PageTransition>
      <PageHeader
        eyebrow="Services"
        title="Everything a room needs, from one team."
        intro="Commission the whole journey or a single stage. Each service ends with a clear deliverable you can build from."
      />
      <section className="container-page pb-10" aria-label="All services">
        <ul className="space-y-16 lg:space-y-24">
          {services.map((service, index) => {
            const Icon = serviceIcons[service.icon];
            const flip = index % 2 === 1;
            return (
              <li key={service.slug}>
                <Reveal className="grid-12 items-center gap-y-8">
                  <Link
                    href={`/services/${service.slug}`}
                    className={`group bg-muted relative col-span-12 block aspect-[3/2] overflow-hidden rounded-sm lg:col-span-7 ${flip ? "lg:order-2 lg:col-start-6" : ""}`}
                    tabIndex={-1}
                    aria-hidden
                  >
                    <Image
                      src={service.image.src}
                      alt=""
                      fill
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  </Link>
                  <div
                    className={`col-span-12 lg:col-span-4 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-9"}`}
                  >
                    <Icon className="text-accent size-8" strokeWidth={1.25} aria-hidden />
                    <h2 className="mt-5 text-4xl">{service.title}</h2>
                    <p className="text-fg-muted mt-4 leading-relaxed">{service.description[0]}</p>
                    <ul className="mt-5 space-y-1.5 text-sm">
                      {service.included.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2.5">
                          <span
                            className="bg-accent mt-2 size-1 shrink-0 rounded-full"
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/services/${service.slug}`}
                      className="text-accent mt-6 inline-flex min-h-11 items-center gap-1.5 font-medium"
                    >
                      Explore {service.title.toLowerCase()}{" "}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>
      <CtaBanner />
    </PageTransition>
  );
}
