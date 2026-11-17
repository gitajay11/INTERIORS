import { Reveal } from "@/components/sections/motion";

const recognitions = [
  {
    publication: "Architectural Digest",
    highlight: "AD100 Most Influential Designers",
  },
  {
    publication: "Elle Decor",
    highlight: "Emerging Practice of the Year",
  },
  {
    publication: "India Design Awards",
    highlight: "Residential Interior of the Year",
  },
  {
    publication: "FOAID Design Honours",
    highlight: "Best Workplace Winner",
  },
  {
    publication: "Trends Excellence",
    highlight: "Hospitality Interior Gold",
  },
];

export function TrustBar() {
  return (
    <section
      aria-label="Recognition and press"
      className="border-border bg-surface/50 border-y py-10 sm:py-12"
    >
      <div className="container-page">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row lg:gap-12">
            <div className="text-center lg:text-left shrink-0">
              <p className="eyebrow">Recognition</p>
              <p className="text-fg-muted mt-1 text-xs tracking-wider uppercase">
                Featured in & honoured by
              </p>
            </div>

            <div className="border-border/60 grid w-full grid-cols-2 gap-6 sm:grid-cols-3 lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-8">
              {recognitions.map((item) => (
                <div
                  key={item.publication}
                  className="group flex flex-col items-center text-center lg:items-start lg:text-left"
                >
                  <span className="font-serif text-lg font-normal tracking-wide text-fg/85 transition-colors group-hover:text-fg sm:text-xl">
                    {item.publication}
                  </span>
                  <span className="text-fg-muted/80 mt-1 text-[11px] font-medium tracking-normal">
                    {item.highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
