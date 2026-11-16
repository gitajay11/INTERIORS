"use client";

import { Suspense, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

/** App-wide client providers: theme, smooth scrolling and navigation feedback. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {/* Both read the current route, so they stay out of the prerendered shell. */}
      <Suspense fallback={null}>
        <SmoothScroll />
        <NavigationProgress />
      </Suspense>
      {children}
    </ThemeProvider>
  );
}
