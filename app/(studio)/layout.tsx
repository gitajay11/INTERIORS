import { SiteHeader } from "@/components/layout/SiteHeader";

/** The 3D Studio is a full-viewport tool: header only, no footer or floating buttons. */
export default function StudioLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </>
  );
}
