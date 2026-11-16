import type { Metadata } from "next";
import { Configurator } from "@/components/three/Configurator";
import { pageMetadata } from "@/lib/seo";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "3D Design Studio",
  description:
    "Design a room in real time: change wall colours, flooring and furniture, explore it from any angle, then share the result or book a consultation with it.",
  path: "/studio",
  image: "/images/hero.jpg",
});

export default function StudioPage() {
  return (
    <PageTransition>
      <Configurator />
    </PageTransition>
  );
}
