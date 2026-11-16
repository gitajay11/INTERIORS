"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/**
 * A thin progress line along the top edge. It starts when an internal link is
 * clicked and completes when the new route has rendered, so a slow navigation
 * never looks like nothing happened.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      clearTimers();
      // Instant (prefetched) navigations finish before this fires and show nothing.
      timers.current.push(window.setTimeout(() => setPhase("loading"), 90));
      // Safety net in case the navigation is cancelled.
      timers.current.push(window.setTimeout(() => setPhase("idle"), 12_000));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The route has rendered: finish the bar, then hide it.
  useEffect(() => {
    clearTimers();
    setPhase((current) => (current === "loading" ? "done" : "idle"));
    const id = window.setTimeout(() => setPhase("idle"), 400);
    return () => window.clearTimeout(id);
  }, [pathname, search]);

  return (
    <div
      aria-hidden
      className="nav-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      data-phase={phase}
    >
      <div className="nav-progress-bar bg-accent h-full origin-left" />
    </div>
  );
}
