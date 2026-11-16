import Link from "next/link";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { mainNav, site, whatsappLink } from "@/lib/site";

export function Footer({ services }: { services: { slug: string; title: string }[] }) {
  return (
    <footer className="border-border bg-surface border-t">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Link href="/" className="font-serif text-3xl">
            Interiors
          </Link>
          <p className="text-fg-muted mt-4 max-w-xs leading-relaxed">
            Spaces designed around you: homes, workplaces and hospitality interiors, from our studio
            in Chennai.
          </p>
          <div className="mt-8">
            <h2 className="font-sans text-sm font-semibold tracking-wide">Journal by email</h2>
            <p className="text-fg-muted mt-1 text-sm">One considered letter a month. No noise.</p>
            <NewsletterForm />
          </div>
        </div>

        <nav className="lg:col-span-2" aria-label="Footer: explore">
          <h2 className="eyebrow mb-4 font-sans">Explore</h2>
          <ul className="space-y-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-accent flex min-h-9 items-center transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/book"
                className="hover:text-accent flex min-h-9 items-center transition-colors"
              >
                Book a consultation
              </Link>
            </li>
          </ul>
        </nav>

        <nav className="lg:col-span-3" aria-label="Footer: services">
          <h2 className="eyebrow mb-4 font-sans">Services</h2>
          <ul className="space-y-1">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  className="hover:text-accent flex min-h-9 items-center transition-colors"
                >
                  {service.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="eyebrow mb-4 font-sans">Studio</h2>
          <address className="space-y-1 not-italic">
            <p>{site.address.street}</p>
            <p>
              {site.address.locality} {site.address.postalCode}, {site.address.countryName}
            </p>
            <p className="pt-3">
              <a
                href={`tel:${site.phoneHref}`}
                className="hover:text-accent inline-flex min-h-9 items-center"
              >
                {site.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${site.email}`}
                className="hover:text-accent inline-flex min-h-9 items-center break-all"
              >
                {site.email}
              </a>
            </p>
            <p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent inline-flex min-h-9 items-center"
              >
                WhatsApp us
              </a>
            </p>
          </address>
          <dl className="text-fg-muted mt-4 text-sm">
            {site.hours.map((entry) => (
              <div key={entry.days} className="flex justify-between gap-4 py-0.5">
                <dt>{entry.days}</dt>
                <dd>{entry.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="border-border border-t">
        <div className="container-page text-fg-muted flex flex-col gap-4 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>© {site.legalName}. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-1" aria-label="Social media">
            {site.socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent inline-flex min-h-9 items-center transition-colors"
                >
                  {social.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
