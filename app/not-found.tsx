import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="container-page flex min-h-dvh flex-col items-start justify-center py-32"
    >
      <p className="eyebrow">404</p>
      <h1 className="mt-4 max-w-2xl text-6xl md:text-7xl">This room does not exist.</h1>
      <p className="text-fg-muted mt-5 max-w-md text-lg leading-relaxed">
        The page may have moved, or the link may be out of date. These will get you back on the
        plan.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/">Home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/projects">Projects</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/contact">Contact</Link>
        </Button>
      </div>
    </main>
  );
}
