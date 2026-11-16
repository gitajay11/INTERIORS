"use client";

/**
 * Home page hero: a scroll-driven walk through a house.
 *
 * The section is several screens tall and its content is pinned, so scrolling
 * moves the camera instead of the page: up the garden path, through the front
 * door and from room to room. At any point the visitor can stop and look
 * around a full 360°: drag with a mouse, swipe sideways on a touch screen, or
 * use the left and right arrow keys. Scrolling on turns the view back to the
 * route. Captions, a room index and a progress line are ordinary DOM on top of
 * the canvas.
 *
 * Devices that cannot (or should not) run it — no WebGL, reduced motion, data
 * saver, very low-end hardware — get a normal one-screen hero with a still image.
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { ArrowDown, ArrowRight, Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MAX_PITCH,
  STOPS,
  TOUR_WAKE,
  activeStop,
  scrollToCurve,
  wrapAngle,
  type LookState,
} from "./tour/plan";

const TourCanvas = dynamic(() => import("./tour/TourCanvas"), { ssr: false });

/** First frame of the walk; painted immediately and replaced by the live scene. */
const POSTER = "/images/tour-start.jpg";
/** Still used when the walkthrough is not available. */
const STILL = "/images/hero.jpg";
/** Scroll distance per leg of the walk, in viewport heights. */
const LEG_VH = 90;
const SECTION_VH = 100 + (STOPS.length - 1) * LEG_VH;
const LAST = STOPS.length - 1;

/** Radians turned per pixel dragged. Touch is a little faster: a phone is only ~400 px wide. */
const DRAG_SPEED = { mouse: 0.0045, touch: 0.008 };
/** Radians turned per press of an arrow key. */
const KEY_STEP = Math.PI / 8;

const wakeCanvas = () => window.dispatchEvent(new Event(TOUR_WAKE));

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function canRunTour(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /2g/.test(nav.connection.effectiveType)) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return false;
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function startingQuality(): "high" | "low" {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.deviceMemory && nav.deviceMemory <= 4) || nav.hardwareConcurrency <= 4) return "low";
  // Phones and tablets: skip post-processing, which costs the most battery.
  return window.matchMedia("(pointer: coarse)").matches ? "low" : "high";
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

export function HouseTour() {
  const section = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  /** Position along the camera curve; read by the canvas every frame. */
  const progress = useRef(0);
  /** Where the visitor has turned to look; read by the canvas every frame. */
  const look = useRef<LookState>({ yaw: 0, pitch: 0, dragging: false });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastScroll = useRef(-1);
  const lenis = useLenis();

  const [mode, setMode] = useState<"tour" | "still">("tour");
  const [quality, setQuality] = useState<"high" | "low">("high");
  const [stop, setStop] = useState(0);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const [finePointer, setFinePointer] = useState(false);
  /** The view is turned away from the route (offers "Reset view"). */
  const [turned, setTurned] = useState(false);
  /** The visitor has looked around at least once, so the hint can go. */
  const [hinted, setHinted] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  // Decide before the first paint, so a still-image hero never flashes tall.
  useIsomorphicLayoutEffect(() => {
    if (!canRunTour()) {
      setMode("still");
      return;
    }
    setQuality(startingQuality());
    setFinePointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const update = useCallback(() => {
    const node = section.current;
    if (!node) return;
    const range = Math.max(1, node.offsetHeight - window.innerHeight);
    const scrolled = Math.min(1, Math.max(0, -node.getBoundingClientRect().top / range));
    progress.current = scrollToCurve(scrolled);
    setStop(activeStop(scrolled));
    // Walking on turns the view back to the route (the camera eases there).
    if (
      lastScroll.current >= 0 &&
      Math.abs(scrolled - lastScroll.current) > 0.0004 &&
      !look.current.dragging
    ) {
      look.current.yaw = 0;
      look.current.pitch = 0;
      setTurned(false);
    }
    lastScroll.current = scrolled;
    if (bar.current) bar.current.style.transform = `scaleX(${scrolled})`;
  }, []);

  useEffect(() => {
    if (mode !== "tour") return;
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [mode, update]);

  // Load the 3D bundle once the page has settled, and stop drawing off screen.
  useEffect(() => {
    if (mode !== "tour") return;
    const timer = window.setTimeout(() => setLive(true), 500);
    const node = section.current;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px",
    });
    if (node) observer.observe(node);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [mode]);

  // ---- Looking around ------------------------------------------------------
  const settleLook = useCallback(() => {
    const view = look.current;
    view.yaw = wrapAngle(view.yaw);
    setTurned(Math.abs(view.yaw) > 0.12 || Math.abs(view.pitch) > 0.12);
    wakeCanvas();
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    look.current.dragging = true;
    // Keep receiving the drag when the pointer leaves the hero. (Touch is captured implicitly.)
    if (event.pointerType !== "touch") {
      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault(); // no text selection or image dragging
      setGrabbing(true);
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (!from || from.id !== event.pointerId) return;
    const touch = event.pointerType === "touch";
    const speed = touch ? DRAG_SPEED.touch : DRAG_SPEED.mouse;
    const view = look.current;
    // "Grab the room": dragging right brings what is on the left into view.
    view.yaw += (event.clientX - from.x) * speed;
    // On touch screens vertical movement scrolls (walks), so only the mouse tilts the view.
    if (!touch) {
      view.pitch = Math.min(
        MAX_PITCH,
        Math.max(-MAX_PITCH, view.pitch + (event.clientY - from.y) * speed),
      );
    }
    from.x = event.clientX;
    from.y = event.clientY;
    wakeCanvas();
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    look.current.dragging = false;
    setGrabbing(false);
    setHinted(true);
    settleLook();
  };

  const resetLook = () => {
    look.current.yaw = 0;
    look.current.pitch = 0;
    setTurned(false);
    wakeCanvas();
  };

  // Left and right arrow keys turn the view while the walkthrough fills the screen.
  useEffect(() => {
    if (mode !== "tour") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const node = section.current;
      if (!node) return;
      const focused = document.activeElement;
      if (focused && focused !== document.body && !node.contains(focused)) return;
      const rect = node.getBoundingClientRect();
      if (rect.top > 1 || rect.bottom < window.innerHeight - 1) return; // not pinned
      look.current.yaw += event.key === "ArrowLeft" ? KEY_STEP : -KEY_STEP;
      setHinted(true);
      settleLook();
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, settleLook]);

  const jumpTo = (index: number) => {
    const node = section.current;
    if (!node) return;
    const range = node.offsetHeight - window.innerHeight;
    const top = node.getBoundingClientRect().top + window.scrollY + STOPS[index].at * range;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  // -------------------------------------------------------------------------
  // Still-image hero
  // -------------------------------------------------------------------------
  if (mode === "still") {
    return (
      <section
        className="relative flex h-dvh min-h-[38rem] items-end overflow-hidden text-white"
        aria-labelledby="hero-title"
      >
        <Image
          src={STILL}
          alt="A sunlit living room with an oak floor, bouclé sofa and travertine table"
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
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent"
          aria-hidden
        />
        <div className="container-page relative pb-20 md:pb-24">
          <HeroCopy />
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------------------
  // Walkthrough
  // -------------------------------------------------------------------------
  const atStart = stop === 0;
  return (
    <section
      ref={section}
      className="relative text-white"
      style={{ height: `${SECTION_VH}vh` }}
      aria-labelledby="hero-title"
    >
      <div className="sticky top-0 h-dvh min-h-[34rem] overflow-hidden bg-[#dce7ec]">
        <div className="absolute inset-0">
          <Image
            src={POSTER}
            alt="A low white house with a timber front door, seen from the garden path"
            fill
            preload
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {live && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              ready ? "opacity-100" : "opacity-0",
            )}
            role="img"
            aria-label="3D walk through the house: entrance, living room, kitchen and dining, bedroom and study. Scroll to walk; drag, swipe sideways or press the left and right arrow keys to look around."
          >
            <TourCanvas
              progress={progress}
              quality={quality}
              paused={!inView}
              look={look}
              onReady={() => setReady(true)}
              onSlow={() => setQuality("low")}
            />
          </div>
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

        {/* Look-around surface: sits above the scene and below every control.
            touch-pan-y leaves vertical swipes to the page (walking) and hands
            sideways ones to us (turning). */}
        <div
          className={cn(
            "absolute inset-0 touch-pan-y select-none",
            grabbing ? "cursor-grabbing" : "cursor-grab",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          aria-hidden
        />

        {/* Opening title. Only its links take the pointer, so the scene can be dragged through it. */}
        <div
          className={cn(
            "container-page pointer-events-none absolute inset-x-0 bottom-0 pb-24 transition-[opacity,transform] duration-500 md:pb-24",
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
              if (index === 0) return null;
              const active = stop === index;
              return (
                <div
                  key={item.id}
                  inert={!active}
                  className={cn(
                    "absolute bottom-0 left-0 w-full max-w-md rounded-2xl border border-white/20 bg-black/40 p-5 shadow-[0_18px_50px_-20px_rgb(0_0_0/0.7)] backdrop-blur-md transition-[opacity,transform] duration-500 md:p-7",
                    active
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "translate-y-3 opacity-0",
                  )}
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-white/75 uppercase tabular-nums">
                    0{index} / 0{LAST} · {item.label}
                  </p>
                  <h2 className="mt-3 text-3xl md:text-4xl">{item.title}</h2>
                  <p className="mt-3 leading-relaxed text-white/85">{item.text}</p>
                  {index === LAST && (
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

        {/* Room index: jump straight to any part of the house */}
        <nav
          aria-label="Rooms in the walkthrough"
          className="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-2xl border border-white/15 bg-black/30 p-2 backdrop-blur-md md:block lg:right-6"
        >
          <ol>
            {STOPS.map((item, index) => {
              const active = stop === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(index)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "group flex min-h-9 w-full items-center justify-end gap-3 rounded-xl px-3 text-sm transition-colors hover:bg-white/10",
                      active ? "text-white" : "text-white/60 hover:text-white",
                    )}
                  >
                    <span className={cn("hidden lg:inline", active && "font-semibold")}>
                      {item.label}
                    </span>
                    <span className="sr-only lg:hidden">{item.label}</span>
                    <span
                      className={cn(
                        "size-2 rounded-full border border-current transition-transform",
                        active && "scale-150 bg-current",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Bottom: how to move, how to look, and a way out */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 px-16 text-xs [&>*]:pointer-events-auto">
          {atStart ? (
            <p className="flex items-center gap-2 font-semibold tracking-[0.16em] uppercase">
              <ArrowDown className="size-4 animate-bounce" aria-hidden />
              <span>
                Scroll to walk in
                <span className="hidden sm:inline">
                  {" "}
                  · {finePointer ? "drag" : "swipe"} to look around
                </span>
              </span>
            </p>
          ) : (
            <>
              {!hinted && !turned && (
                <p className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 font-medium tracking-wide backdrop-blur-md">
                  <Move className="size-3.5" aria-hidden />
                  {finePointer ? "Drag to look around" : "Swipe to look"}
                </p>
              )}
              {turned && (
                <button
                  type="button"
                  onClick={resetLook}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 font-medium tracking-wide backdrop-blur-md transition-colors hover:bg-black/55"
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset view
                </button>
              )}
              {stop !== LAST && (
                <a
                  href="#studio"
                  className="rounded-full border border-white/20 bg-black/35 px-3.5 py-2 font-medium tracking-wide backdrop-blur-md transition-colors hover:bg-black/55"
                >
                  Skip the tour
                </a>
              )}
            </>
          )}
        </div>

        {/* Progress through the walk */}
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
