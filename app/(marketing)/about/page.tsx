import type { Metadata } from "next";
import Image from "next/image";
import { CtaBanner, PageHeader, SectionHeading } from "@/components/sections/common";
import { Counter, Reveal } from "@/components/sections/motion";
import { TeamGrid } from "@/components/sections/TeamGrid";
import { getAwards, getTeam } from "@/lib/content";
import { industries, milestones, philosophy } from "@/lib/data/studio";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "About the studio",
  description:
    "The story, philosophy, team and awards of Interiors, a Chennai-based interior design studio founded in 2011.",
  path: "/about",
});

const studioPhotos = [
  {
    src: "/images/projects/boat-club-residence/wide.jpg",
    alt: "Living room mock-up in the studio's 3D model",
  },
  { src: "/images/projects/atlas-capital-office/detail.jpg", alt: "Desk and library wall detail" },
  {
    src: "/images/projects/alibaug-villa/side.jpg",
    alt: "Bedroom suite seen from the window side",
  },
  { src: "/images/projects/the-fig-house/wide.jpg", alt: "Open kitchen and dining room" },
  { src: "/images/projects/maison-nila-boutique/detail.jpg", alt: "Boutique seating detail" },
];

export default async function AboutPage() {
  const [team, awards] = await Promise.all([getTeam(), getAwards()]);
  const organisations = [...new Set(awards.map((award) => award.organisation))];

  return (
    <PageTransition>
      <PageHeader
        eyebrow="About the studio"
        title={
          <>
            A small studio with a <span className="italic">long memory.</span>
          </>
        }
        intro="We have spent fourteen years learning what makes a room feel settled. This is how we got here, what we believe and who you will work with."
      />

      <div className="container-page">
        <div className="bg-muted relative aspect-[16/9] overflow-hidden rounded-sm lg:aspect-[21/9]">
          <Image
            src="/images/projects/boat-club-residence/side.jpg"
            alt="A living room designed by the studio, seen from the window side"
            fill
            preload
            sizes="(min-width: 1344px) 1264px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* ---- Story timeline ---- */}
      <section className="container-page section" aria-labelledby="story-title">
        <div className="grid-12 gap-y-10">
          <div className="col-span-12 lg:col-span-4">
            <p className="eyebrow">Our story</p>
            <h2 id="story-title" className="mt-3 text-4xl md:text-5xl">
              Fourteen years, one room at a time
            </h2>
          </div>
          <ol className="border-border col-span-12 border-l lg:col-span-7 lg:col-start-6">
            {milestones.map((milestone, index) => (
              <li key={milestone.year} className="relative pb-10 pl-8 last:pb-0">
                <span
                  className="bg-accent absolute top-2 -left-[5px] size-[9px] rounded-full"
                  aria-hidden
                />
                <Reveal delay={index * 0.04}>
                  <p className="text-accent font-serif text-3xl tabular-nums">{milestone.year}</p>
                  <h3 className="mt-1 text-2xl">{milestone.title}</h3>
                  <p className="text-fg-muted mt-2 max-w-xl leading-relaxed">{milestone.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Philosophy ---- */}
      <section
        className="bg-surface border-border section border-y"
        aria-labelledby="philosophy-title"
      >
        <div className="container-page">
          <SectionHeading
            eyebrow="Design philosophy"
            title={<span id="philosophy-title">Four things we will not compromise on</span>}
          />
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {philosophy.map((principle, index) => (
              <li key={principle.title}>
                <Reveal delay={index * 0.08}>
                  <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-sm">
                    <Image
                      src={`/images/projects/${principle.image}.jpg`}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-accent mt-5 text-sm font-semibold tabular-nums">
                    0{index + 1}
                  </p>
                  <h3 className="mt-1 text-2xl">{principle.title}</h3>
                  <p className="text-fg-muted mt-2 leading-relaxed">{principle.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Team ---- */}
      <section className="container-page section" aria-labelledby="team-title">
        <SectionHeading
          eyebrow="The team"
          title={<span id="team-title">The people you will work with</span>}
          intro="Select a portrait to read more."
        />
        <TeamGrid team={team} />
      </section>

      {/* ---- Awards ---- */}
      <section className="bg-muted section" aria-labelledby="awards-title">
        <div className="container-page">
          <SectionHeading
            eyebrow="Recognition"
            title={<span id="awards-title">Awards and achievements</span>}
          />
          {/* "logo wall": awarding bodies set as wordmarks */}
          <ul
            className="border-border grid grid-cols-2 border-t border-l md:grid-cols-3 lg:grid-cols-6"
            aria-label="Awarding organisations"
          >
            {organisations.slice(0, 6).map((organisation) => (
              <li
                key={organisation}
                className="border-border flex min-h-28 items-center justify-center border-r border-b p-5 text-center font-serif text-lg leading-tight"
              >
                {organisation}
              </li>
            ))}
          </ul>
          <ul className="mt-12">
            {awards.map((award) => (
              <li
                key={`${award.year}-${award.title}`}
                className="border-border grid grid-cols-12 gap-x-4 border-b py-5"
              >
                <span className="text-accent col-span-2 font-serif text-2xl tabular-nums lg:col-span-1">
                  {award.year}
                </span>
                <span className="col-span-10 lg:col-span-5">
                  <span className="block font-serif text-2xl">{award.title}</span>
                  {award.project && <span className="text-fg-muted text-sm">{award.project}</span>}
                </span>
                <span className="text-fg-muted col-span-10 col-start-3 mt-1 lg:col-span-6 lg:col-start-7 lg:mt-0 lg:text-right">
                  {award.organisation}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Experience ---- */}
      <section className="container-page section" aria-labelledby="experience-title">
        <SectionHeading
          eyebrow="Studio experience"
          title={<span id="experience-title">By the numbers</span>}
        />
        <dl className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {site.stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-serif text-6xl md:text-7xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-fg-muted mt-2 text-sm">{stat.label}</dt>
            </div>
          ))}
        </dl>

        <h3 className="mt-16 text-3xl">Industries we serve</h3>
        <ul className="mt-6 flex flex-wrap gap-2">
          {industries.map((industry) => (
            <li key={industry} className="border-border rounded-full border px-4 py-2 text-sm">
              {industry}
            </li>
          ))}
        </ul>

        <h3 className="mt-16 text-3xl">From the studio</h3>
        <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {studioPhotos.map((photo, index) => (
            <li key={photo.src} className={index === 0 ? "col-span-2 row-span-2" : ""}>
              <div
                className={`bg-muted relative overflow-hidden rounded-sm ${index === 0 ? "aspect-square" : "aspect-square"}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={
                    index === 0
                      ? "(min-width: 1024px) 50vw, 100vw"
                      : "(min-width: 1024px) 25vw, 50vw"
                  }
                  className="object-cover"
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <CtaBanner
        title="Come and see the materials library."
        text="Visit us in Nungambakkam, or book a video consultation from wherever you are."
      />
    </PageTransition>
  );
}
