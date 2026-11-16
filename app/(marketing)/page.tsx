import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CtaBanner, SectionHeading } from "@/components/sections/common";
import { FeaturedCarousel, ProcessTimeline, TestimonialCarousel } from "@/components/sections/home";
import { Counter, Reveal } from "@/components/sections/motion";
import { ServicesShowcase } from "@/components/sections/ServicesShowcase";
import { HouseTour } from "@/components/three/HouseTour";
import { Button } from "@/components/ui/button";
import { getFeaturedProjects, getServices, getTestimonials } from "@/lib/content";
import { processSteps } from "@/lib/data/studio";
import { site } from "@/lib/site";
import { PageTransition } from "@/components/layout/PageTransition";

export default async function HomePage() {
  const [featured, services, testimonials] = await Promise.all([
    getFeaturedProjects(),
    getServices(),
    getTestimonials(),
  ]);

  return (
    <PageTransition>
      {/* ---- Hero: scroll-driven walk through a house ---- */}
      <HouseTour />

      {/* ---- Studio introduction ---- */}
      <section id="studio" className="container-page section">
        <div className="grid-12 gap-y-12">
          <Reveal className="col-span-12 lg:col-span-5">
            <p className="eyebrow">The studio</p>
            <h2 className="mt-3 text-4xl md:text-5xl">
              Fourteen years of making rooms people do not want to leave.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="col-span-12 lg:col-span-6 lg:col-start-7">
            <p className="text-lg leading-relaxed">
              {site.name} began in 2011 as two people and a drawing board. Today we are thirty-two
              designers, architects and makers — and every client still works with one lead designer
              from the first conversation to the day we hand over the keys.
            </p>
            <p className="text-fg-muted mt-5 leading-relaxed">
              We start with light, choose fewer and better things, and use honest materials that
              improve with age. Then we show you all of it in a real-time 3D model, so the finished
              room holds no surprises.
            </p>
            <Link
              href="/about"
              className="text-accent mt-7 inline-flex min-h-11 items-center gap-1.5 font-medium"
            >
              About the studio <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
        <dl className="border-border mt-16 grid grid-cols-2 gap-y-10 border-t pt-12 lg:grid-cols-4">
          {site.stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-serif text-6xl md:text-7xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-fg-muted mt-2 text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Featured projects ---- */}
      <section className="section bg-surface" aria-labelledby="featured-title">
        <div className="container-page">
          <SectionHeading
            eyebrow="Selected work"
            title={<span id="featured-title">Featured projects</span>}
            action={
              <Button asChild variant="outline">
                <Link href="/projects">
                  View all projects <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          />
        </div>
        <FeaturedCarousel projects={featured} />
      </section>

      {/* ---- Services ---- */}
      <section className="container-page section">
        <SectionHeading
          eyebrow="What we do"
          title="Six services, one team"
          intro="Take the full journey with us, or bring us in for the part you need. Select a service to see what it covers."
        />
        <Reveal>
          <ServicesShowcase
            services={services.map(({ slug, title, icon, summary, image, included }) => ({
              slug,
              title,
              icon,
              summary,
              image,
              included: included.slice(0, 3),
            }))}
          />
        </Reveal>
      </section>

      {/* ---- Process ---- */}
      <section className="bg-muted section">
        <div className="container-page">
          <SectionHeading
            eyebrow="How we work"
            title="From first conversation to handover"
            intro="Five stages, each with a clear outcome and your sign-off before the next begins."
          />
          <ProcessTimeline steps={processSteps} />
        </div>
      </section>

      {/* ---- 3D Studio teaser ---- */}
      <section className="container-page section">
        <div className="grid-12 items-center gap-y-10">
          <Reveal className="col-span-12 lg:col-span-7">
            <Link
              href="/studio"
              className="group bg-muted relative block aspect-[3/2] overflow-hidden rounded-sm"
            >
              <Image
                src="/images/projects/alwarpet-loft/cover.jpg"
                alt="A room configured in the 3D Design Studio"
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="col-span-12 lg:col-span-4 lg:col-start-9">
            <p className="eyebrow">3D Design Studio</p>
            <h2 className="mt-3 text-4xl md:text-5xl">Design a room yourself.</h2>
            <p className="text-fg-muted mt-5 leading-relaxed">
              Repaint the walls, change the floor, try three different sofas. Orbit the room from
              any angle, then send us the result with your consultation request.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/studio">
                Open the studio <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ---- Testimonials ---- */}
      <section className="border-border bg-surface section border-y">
        <div className="container-page">
          <p className="eyebrow mb-10">In our clients&rsquo; words</p>
          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      <CtaBanner />
    </PageTransition>
  );
}
