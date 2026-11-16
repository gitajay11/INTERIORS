"use client";

/** Interactive home page sections: project carousel, process timeline, testimonials. */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Avatar, ProjectCard, Rating } from "@/components/sections/common";
import type { Project, Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

const arrowButton =
  "border-border hover:bg-muted flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-40";

// ---------------------------------------------------------------------------
// Featured projects: horizontal scroll-snap carousel
// ---------------------------------------------------------------------------
export function FeaturedCarousel({ projects }: { projects: Project[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const update = () =>
      setEdges({
        start: node.scrollLeft < 8,
        end: node.scrollLeft + node.clientWidth > node.scrollWidth - 8,
      });
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (direction: 1 | -1) => {
    const node = track.current;
    const card = node?.querySelector("li");
    if (!node || !card) return;
    node.scrollBy({ left: direction * (card.clientWidth + 24), behavior: "smooth" });
  };

  return (
    <div>
      <ul
        ref={track}
        tabIndex={0}
        aria-label="Featured projects"
        // Horizontal wheel/trackpad gestures belong to the carousel, not to smooth scrolling.
        data-lenis-prevent-touch
        className="no-scrollbar container-page flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto scroll-smooth pb-2 md:scroll-px-10"
      >
        {projects.map((project) => (
          <li
            key={project.slug}
            className="w-[82vw] shrink-0 snap-start sm:w-[58vw] lg:w-[40vw] xl:w-[34rem]"
          >
            <ProjectCard
              project={project}
              aspect="aspect-[4/5] sm:aspect-[4/3]"
              sizes="(min-width: 1280px) 544px, (min-width: 1024px) 40vw, (min-width: 640px) 58vw, 82vw"
            />
          </li>
        ))}
      </ul>
      <div className="container-page mt-8 flex justify-end gap-2">
        <button
          type="button"
          className={arrowButton}
          onClick={() => scrollBy(-1)}
          disabled={edges.start}
          aria-label="Previous projects"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          className={arrowButton}
          onClick={() => scrollBy(1)}
          disabled={edges.end}
          aria-label="Next projects"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design process: scroll-driven timeline (GSAP ScrollTrigger)
// ---------------------------------------------------------------------------
export function ProcessTimeline({ steps }: { steps: { title: string; text: string }[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let revert: (() => void) | undefined;
    // GSAP is only needed by this section, which sits well below the fold, so
    // it is fetched after the page has loaded instead of in the first bundle.
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const media = gsap.matchMedia(root);
        // Only animate for visitors who have not asked for reduced motion; without
        // JS (or with reduced motion) the timeline simply renders complete.
        media.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(
            ".process-line",
            { scaleX: 0, scaleY: 0 },
            {
              scaleX: 1,
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: root.current,
                start: "top 75%",
                end: "bottom 60%",
                scrub: 0.6,
              },
            },
          );
          gsap.utils.toArray<HTMLElement>(".process-step").forEach((step) => {
            gsap.from(step, {
              opacity: 0.25,
              y: 24,
              duration: 0.7,
              ease: "power2.out",
              scrollTrigger: {
                trigger: step,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            });
            gsap.from(step.querySelector(".process-dot"), {
              scale: 0.4,
              backgroundColor: "transparent",
              duration: 0.5,
              scrollTrigger: {
                trigger: step,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            });
          });
        });
        revert = () => media.revert();
      },
    );
    return () => {
      cancelled = true;
      revert?.();
    };
  }, []);

  return (
    <div ref={root} className="relative">
      {/* progress rail: vertical on mobile, horizontal on desktop */}
      <div
        className="bg-border absolute top-0 bottom-0 left-[7px] w-px lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-full"
        aria-hidden
      >
        <div className="process-line bg-accent size-full origin-top-left" />
      </div>
      <ol className="grid gap-10 lg:grid-cols-5 lg:gap-6">
        {steps.map((step, index) => (
          <li key={step.title} className="process-step relative pl-10 lg:pt-10 lg:pl-0">
            <span
              className="process-dot border-accent bg-accent absolute top-1 left-0 size-[15px] rounded-full border-2 lg:top-0"
              aria-hidden
            />
            <p className="text-accent text-sm font-semibold tabular-nums">0{index + 1}</p>
            <h3 className="mt-2 text-2xl">{step.title}</h3>
            <p className="text-fg-muted mt-3 text-[0.9375rem] leading-relaxed">{step.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Testimonials carousel
// ---------------------------------------------------------------------------
export function TestimonialCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  // Auto-advance, unless the visitor is reading (hover/focus) or prefers reduced motion.
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), 7000);
    return () => clearInterval(timer);
  }, [paused, count]);

  const go = (delta: number) => setIndex((current) => (current + delta + count) % count);
  const active = testimonials[index];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="grid gap-10 lg:grid-cols-12 lg:items-center"
    >
      <figure key={index} className="animate-fade-in lg:col-span-9" aria-live="polite">
        <Rating value={active.rating} />
        <blockquote className="mt-6 font-serif text-3xl leading-snug md:text-4xl lg:text-5xl">
          “{active.quote}”
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-4">
          <Avatar name={active.name} tint={active.tint} className="size-14 rounded-full text-xs" />
          <div>
            <p className="font-medium">{active.name}</p>
            <p className="text-fg-muted text-sm">
              {active.projectType} · {active.location}
            </p>
          </div>
        </figcaption>
      </figure>
      <div className="flex items-center gap-4 lg:col-span-3 lg:flex-col lg:items-end">
        <div className="flex gap-2">
          <button
            type="button"
            className={arrowButton}
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className={arrowButton}
            onClick={() => go(1)}
            aria-label="Next testimonial"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
        <div className="flex gap-1" role="group" aria-label="Choose testimonial">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Testimonial ${i + 1} of ${count}`}
              aria-current={i === index}
              className="flex size-6 items-center justify-center"
            >
              <span
                className={cn(
                  "h-0.5 w-5 transition-colors",
                  i === index ? "bg-accent" : "bg-border",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
