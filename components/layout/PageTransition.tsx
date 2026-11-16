import { ViewTransition, type ReactNode } from "react";

/**
 * Cross-fades page content on route changes (View Transitions API). Browsers
 * without support simply swap the content.
 *
 * Wrap the content of every `page.tsx` in this, not the layout: pages mount
 * and unmount on navigation, which is what triggers the exit and enter
 * animations, while filter and search-param changes on the same page do not.
 *
 * It deliberately reads no router state. A layout-level wrapper keyed on the
 * pathname has to sit inside a Suspense boundary, and React streams large
 * boundaries in after the first paint, so the footer flashed at the top of
 * every page before the content pushed it down (a layout shift of 0.9).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
