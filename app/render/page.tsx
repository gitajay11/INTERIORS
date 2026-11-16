import type { Metadata } from "next";
import { Suspense } from "react";
import { RenderStage } from "./RenderStage";

// Internal tool used by `pnpm render:images`; never indexed.
export const metadata: Metadata = { title: "Render", robots: { index: false, follow: false } };

export default function RenderPage() {
  return (
    <Suspense fallback={null}>
      <RenderStage />
    </Suspense>
  );
}
