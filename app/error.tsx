"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="container-page flex min-h-dvh flex-col items-start justify-center py-32"
    >
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 max-w-2xl text-5xl md:text-6xl">We could not load this page.</h1>
      <p className="text-fg-muted mt-5 max-w-md text-lg leading-relaxed">
        Please try again. If the problem continues, the rest of the site should still work.
      </p>
      <Button size="lg" className="mt-8" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
