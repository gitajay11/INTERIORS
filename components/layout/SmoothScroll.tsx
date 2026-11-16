"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ReactLenis, useLenis } from "lenis/react";

/**
 * Smooth wheel scrolling and gliding anchor links (Lenis). It is a motion
 * effect, so it is left off for users who ask for reduced motion and on touch
 * devices, where native scrolling (with CSS smooth anchors) feels better.
 */
export function SmoothScroll() {
  const [smooth, setSmooth] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setSmooth(!reduced.matches && !coarse.matches);
    update();
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  if (!smooth) return null;
  return (
    <>
      <ReactLenis
        root
        options={{
          lerp: 0.1,
          // Lenis already honours scroll-padding-top, which clears the floating header.
          anchors: { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4) },
        }}
      />
      <RouteScrollSync />
    </>
  );
}

/**
 * Keeps Lenis in step with route changes. Without this, a scroll animation
 * still running when a link is clicked carries on into the next page and
 * fights the scroll-to-top of the router, which reads as a jump.
 */
function RouteScrollSync() {
  const lenis = useLenis();
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!lenis) return;
    if (first.current) {
      first.current = false;
      return;
    }
    // Back/forward: the browser restores the old position; just adopt it.
    if (fromHistory.current) {
      fromHistory.current = false;
      lenis.resize();
      return;
    }
    if (window.location.hash) return;
    lenis.scrollTo(0, { immediate: true, force: true });
    lenis.resize();
  }, [lenis, pathname]);

  return null;
}
