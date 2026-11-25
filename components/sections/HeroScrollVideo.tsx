"use client";

/**
 * Home page hero: a scroll-scrubbed walkthrough video.
 *
 * The section is several screens tall and its content is pinned, so scrolling
 * plays the video forward (and backward) instead of moving the page. A
 * portrait cut is used on phones and a landscape one elsewhere. Visitors with
 * reduced motion or a data saver get a one-screen hero with a still image.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SOURCES = {
  desktop: "/video/scroll_animation_desktop.mp4",
  mobile: "/video/scroll_animation_mobile.mp4",
} as const;
const STILL = "/images/hero.jpg";
const ALT = "A sunlit living room with an oak floor, bouclé sofa and travertine table";

/** Scroll distance of the whole walk, in viewport heights. */
const SECTION_VH = 400;

/** Captions appear when scroll progress (0–1) reaches `at`. */
const STOPS = [
  {
    at: 0.12,
    label: "Living room",
    text: "Wide-plank oak, a deep bouclé sofa and afternoon sun from the west window.",
  },
  {
    at: 0.42,
    label: "Kitchen & dining",
    text: "A full-width kitchen run in marble and walnut, with brass pendants hung low.",
  },
  {
    at: 0.74,
    label: "Bedroom",
    text: "Warm plaster, soft linen and a headboard wall washed with light: nothing asks for attention.",
  },
] as const;

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function canPlay(): boolean {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return false;
  return true;
}

function HeroCopy() {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase">
        Interior design studio · Chennai
      </p>
      <h1 id="hero-title" className="mt-5 max-w-4xl text-6xl md:text-7xl lg:text-8xl">
        Spaces Designed <span className="italic">Around You.</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
        We design calm, considered homes and workplaces — and let you walk through them in 3D before
        a single wall is painted.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Button asChild size="lg" variant="light">
          <Link href="/book">Book Consultation</Link>
        </Button>
        <Button asChild size="lg" variant="outline-light">
          <Link href="/studio">
            Explore 3D Studio <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </>
  );
}

export function HeroScrollVideo() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  /** Scroll progress through the section, 0–1. */
  const target = useRef(0);

  const [mode, setMode] = useState<"video" | "still">("video");
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [stop, setStop] = useState(-1);

  // Decide before the first paint, so a still hero never flashes tall.
  useIsomorphicLayoutEffect(() => {
    if (!canPlay()) setMode("still");
  }, []);

  // Portrait cut on phones, landscape elsewhere.
  useEffect(() => {
    if (mode !== "video") return;
    const query = window.matchMedia("(max-width: 767px)");
    const choose = () => {
      setReady(false);
      setSrc(query.matches ? SOURCES.mobile : SOURCES.desktop);
    };
    choose();
    query.addEventListener("change", choose);
    return () => query.removeEventListener("change", choose);
  }, [mode]);

  // Scroll sets the target; a frame loop eases the video toward it.
  useEffect(() => {
    if (mode !== "video") return;
    const update = () => {
      const node = section.current;
      if (!node) return;
      const range = Math.max(1, node.offsetHeight - window.innerHeight);
      const scrolled = Math.min(1, Math.max(0, -node.getBoundingClientRect().top / range));
      target.current = scrolled;
      let active = -1;
      STOPS.forEach((item, index) => {
        if (scrolled >= item.at) active = index;
      });
      setStop(active);
      if (bar.current) bar.current.style.transform = `scaleX(${scrolled})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    let frame = 0;
    let shown = 0;
    const tick = () => {
      const el = video.current;
      if (el && el.readyState >= 2 && Number.isFinite(el.duration)) {
        shown += (target.current - shown) * 0.18;
        if (Math.abs(target.current - shown) < 0.0005) shown = target.current;
        const time = shown * el.duration;
        if (!el.seeking && Math.abs(el.currentTime - time) > 1 / 90) el.currentTime = time;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  if (mode === "still") {
    return (
      <section
        className="relative flex h-dvh min-h-[38rem] items-end overflow-hidden text-white"
        aria-labelledby="hero-title"
      >
        <Image
          src={STILL}
          alt={ALT}
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25"
          aria-hidden
        />
        <div className="container-page relative pb-20 md:pb-24">
          <HeroCopy />
        </div>
      </section>
    );
  }

  const atStart = stop === -1;
  return (
    <section
      ref={section}
      className="relative text-white"
      style={{ height: `${SECTION_VH}vh` }}
      aria-labelledby="hero-title"
    >
      <div className="sticky top-0 h-dvh min-h-[34rem] overflow-hidden bg-[#1c1712]">
        <Image src={STILL} alt={ALT} fill preload sizes="100vw" className="object-cover" />
        {src && (
          <video
            key={src}
            ref={video}
            src={src}
            muted
            playsInline
            preload="auto"
            aria-hidden
            onLoadedData={() => setReady(true)}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              ready ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Legibility scrims for the opening title; they lift as the walk begins. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-700",
            atStart ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/5 to-transparent" />
        </div>

        <div
          className={cn(
            "container-page pointer-events-none absolute inset-x-0 bottom-0 pb-24 transition-[opacity,transform] duration-500",
            atStart ? "opacity-100 [&_a]:pointer-events-auto" : "-translate-y-4 opacity-0",
          )}
          inert={!atStart}
        >
          <HeroCopy />
        </div>

        {/* Room captions */}
        <div
          className="container-page pointer-events-none absolute inset-x-0 bottom-20 md:bottom-14"
          aria-live="polite"
        >
          <div className="relative">
            {STOPS.map((item, index) => {
              const active = stop === index;
              return (
                <div
                  key={item.label}
                  inert={!active}
                  className={cn(
                    "absolute bottom-0 left-0 w-full max-w-md rounded-2xl border border-white/20 bg-black/40 p-5 shadow-[0_18px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-md transition-[opacity,transform] duration-500 md:p-7",
                    active
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0",
                  )}
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-white/75 uppercase tabular-nums">
                    0{index + 1} / 0{STOPS.length} · {item.label}
                  </p>
                  <p className="mt-3 text-lg leading-relaxed text-white/90">{item.text}</p>
                  {index === STOPS.length - 1 && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button asChild variant="light">
                        <Link href="/studio">
                          Design your own room <ArrowRight aria-hidden />
                        </Link>
                      </Button>
                      <Button asChild variant="outline-light">
                        <Link href="/book">Book consultation</Link>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 px-16 text-xs [&>*]:pointer-events-auto">
          {atStart ? (
            <p className="flex items-center gap-2 font-semibold tracking-[0.16em] uppercase">
              <ArrowDown className="size-4 animate-bounce" aria-hidden />
              Scroll to walk in
            </p>
          ) : (
            stop !== STOPS.length - 1 && (
              <a
                href="#studio"
                className="rounded-full border border-white/20 bg-black/35 px-3.5 py-2 font-medium tracking-wide backdrop-blur-md transition-colors hover:bg-black/55"
              >
                Skip the tour
              </a>
            )
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15" aria-hidden>
          <div
            ref={bar}
            className="bg-accent h-full origin-left"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </div>
    </section>
  );
}
