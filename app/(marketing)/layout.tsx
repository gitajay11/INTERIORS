import { Suspense } from "react";
import { Footer } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getServices } from "@/lib/content";

export default async function MarketingLayout({ children }: LayoutProps<"/">) {
  const services = await getServices();
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer services={services.map(({ slug, title }) => ({ slug, title }))} />
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
    </>
  );
}
