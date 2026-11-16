"use client";

/**
 * Home page "What we do": an interactive index of the six services.
 *
 * Desktop: a vertical tab list beside a large panel. Hovering, focusing or
 * clicking a service swaps the panel's image and details; until the visitor
 * picks one, the list steps through the services by itself.
 * Phone and tablet: the same content as an accordion, one service open at a time.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { serviceIcons } from "@/components/sections/service-icons";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/primitives";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ShowcaseService = Pick<Service, "slug" | "title" | "icon" | "summary" | "image"> & {
  /** A few headline deliverables. */
  included: string[];
};

/** Seconds each service stays up while the list is cycling by itself. */
const DWELL = 7;

const number = (index: number) => String(index + 1).padStart(2, "0");

export function ServicesShowcase({ services }: { services: ShowcaseService[] }) {
  const [active, setActive] = useState(services[0]?.slug ?? "");
  /** Cycling by itself; ends for good once the visitor chooses a service. */
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Only cycle while the section is actually on screen.
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cycling = auto && !reducedMotion;
  const next = () => {
    // The global reduced-motion rule shortens every animation to an instant; never cycle on that.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const index = services.findIndex((service) => service.slug === active);
    setActive(services[(index + 1) % services.length].slug);
  };

  return (
    <div ref={root}>
      {/* ------------------------------------------------------------------ */}
      {/* Desktop: tabs + panel                                               */}
      {/* ------------------------------------------------------------------ */}
      <TabsPrimitive.Root
        value={active}
        onValueChange={(value) => {
          setActive(value);
          setAuto(false);
        }}
        orientation="vertical"
        className="hidden grid-cols-12 gap-x-10 lg:grid"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <TabsPrimitive.List
          aria-label="Services"
          className="border-border col-span-5 flex flex-col border-t"
        >
          {services.map((service, index) => {
            const selected = service.slug === active;
            return (
              <TabsPrimitive.Trigger
                key={service.slug}
                value={service.slug}
                // Hovering previews a service without ending the automatic cycle.
                onPointerEnter={(event) => event.pointerType === "mouse" && setActive(service.slug)}
                className={cn(
                  "group border-border relative flex flex-1 items-center gap-6 border-b py-5 pr-4 pl-5 text-left transition-[background-color,padding] duration-300",
                  selected ? "bg-surface pl-7" : "hover:bg-surface/60",
                )}
              >
                {/* accent bar */}
                <span
                  className={cn(
                    "bg-accent absolute inset-y-0 left-0 w-0.5 origin-top transition-transform duration-300",
                    selected ? "scale-y-100" : "scale-y-0",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums transition-colors",
                    selected ? "text-accent" : "text-fg-muted",
                  )}
                >
                  {number(index)}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block font-serif text-2xl transition-colors xl:text-[1.75rem]",
                      selected ? "text-fg" : "text-fg-muted group-hover:text-fg",
                    )}
                  >
                    {service.title}
                  </span>
                  <span className="text-fg-muted mt-1 block truncate text-sm">
                    {service.summary}
                  </span>
                </span>
                <ArrowRight
                  className={cn(
                    "text-accent size-5 shrink-0 transition-[opacity,transform] duration-300",
                    selected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                  )}
                  aria-hidden
                />
                {/* Dwell timer: fills along the bottom edge, then moves on. */}
                {selected && cycling && (
                  <span
                    key={service.slug}
                    className="bg-accent absolute inset-x-0 bottom-[-1px] h-px origin-left"
                    style={{
                      animation: `grow-x ${DWELL}s linear forwards`,
                      animationPlayState: hovered || !inView ? "paused" : "running",
                    }}
                    onAnimationEnd={next}
                    aria-hidden
                  />
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>

        <div className="relative col-span-7">
          <div className="bg-muted relative h-full min-h-[34rem] overflow-hidden rounded-sm">
            {/* All six images are stacked; the selected one fades and settles in. */}
            {services.map((service, index) => {
              const selected = service.slug === active;
              return (
                <Image
                  key={service.slug}
                  src={service.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1344px) 720px, 58vw"
                  loading={index === 0 ? "eager" : "lazy"}
                  className={cn(
                    "object-cover transition-[opacity,transform] duration-[900ms] ease-out",
                    selected ? "scale-100 opacity-100" : "scale-105 opacity-0",
                  )}
                />
              );
            })}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"
              aria-hidden
            />
            <p className="absolute top-5 left-5 rounded-full bg-black/35 px-3 py-1.5 text-xs font-medium tracking-wide text-white tabular-nums backdrop-blur-md">
              {number(services.findIndex((service) => service.slug === active))} /{" "}
              {number(services.length - 1)}
            </p>

            {services.map((service) => {
              const Icon = serviceIcons[service.icon];
              return (
                <TabsPrimitive.Content
                  key={service.slug}
                  value={service.slug}
                  className="animate-page-in absolute inset-x-0 bottom-0 p-6 text-white outline-none xl:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-3xl xl:text-4xl">{service.title}</h3>
                      <p className="mt-2 max-w-lg leading-relaxed text-white/85">
                        {service.summary}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {service.included.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs backdrop-blur-md"
                      >
                        <Check className="size-3.5" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/services/${service.slug}`}
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-sm bg-white px-5 text-sm font-medium tracking-wide text-[#2b2926] transition-transform hover:-translate-y-0.5 active:scale-[0.97]"
                  >
                    Explore this service <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </TabsPrimitive.Content>
              );
            })}
          </div>
        </div>
      </TabsPrimitive.Root>

      {/* ------------------------------------------------------------------ */}
      {/* Phone and tablet: accordion                                          */}
      {/* ------------------------------------------------------------------ */}
      <Accordion
        type="single"
        collapsible
        defaultValue={services[0]?.slug}
        className="border-border border-t lg:hidden"
      >
        {services.map((service, index) => {
          const Icon = serviceIcons[service.icon];
          return (
            <AccordionItem key={service.slug} value={service.slug}>
              <AccordionTrigger className="gap-4 py-5">
                <span className="flex min-w-0 items-center gap-4">
                  <span className="text-accent text-sm font-semibold tabular-nums">
                    {number(index)}
                  </span>
                  <span className="text-2xl">{service.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="max-w-none pb-7">
                <div className="bg-muted relative aspect-[16/10] overflow-hidden rounded-sm">
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                  <span className="absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md">
                    <Icon className="size-4" strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
                <p className="text-fg mt-5 text-lg leading-relaxed">{service.summary}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {service.included.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/services/${service.slug}`}
                  className="text-accent mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
                >
                  Explore this service <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
