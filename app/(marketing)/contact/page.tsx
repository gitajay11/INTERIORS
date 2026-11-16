import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageHeader } from "@/components/sections/common";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappLink } from "@/lib/site";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact Interiors: call, email, WhatsApp or visit our interior design studio on Khader Nawaz Khan Road, Chennai.",
  path: "/contact",
});

const addressLine = `${site.address.street}, ${site.address.locality} ${site.address.postalCode}, ${site.address.countryName}`;

/** Embed API when a key is configured; otherwise the keyless embed for the same address. */
function mapSrc() {
  const query = encodeURIComponent(`${site.name}, ${addressLine}`);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  return key
    ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}&zoom=15`
    : `https://maps.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=15&output=embed`;
}

export default function ContactPage() {
  const channels = [
    { icon: Phone, label: "Call", value: site.phone, href: `tel:${site.phoneHref}` },
    { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}` },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Message the studio",
      href: whatsappLink(),
      external: true,
    },
  ];

  return (
    <PageTransition>
      <PageHeader
        eyebrow="Contact"
        title="Tell us about your space."
        intro="Write, call or visit. For a new project, the quickest route is to book a consultation — for everything else, we are here."
      />

      <section className="container-page grid-12 gap-y-14 pb-20">
        <div className="col-span-12 lg:col-span-7">
          <h2 className="mb-6 text-3xl">Send a message</h2>
          <ContactForm />
        </div>

        <div className="col-span-12 lg:col-span-4 lg:col-start-9">
          <h2 className="mb-6 text-3xl">Reach us directly</h2>
          <ul className="border-border divide-y divide-[var(--border)] border-y">
            {channels.map((channel) => (
              <li key={channel.label}>
                <a
                  href={channel.href}
                  {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex min-h-16 items-center gap-4 py-3"
                >
                  <channel.icon
                    className="text-accent size-5 shrink-0"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span>
                    <span className="text-fg-muted block text-xs font-semibold tracking-[0.16em] uppercase">
                      {channel.label}
                    </span>
                    <span className="group-hover:text-accent block break-all transition-colors">
                      {channel.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex gap-4">
            <MapPin className="text-accent mt-1 size-5 shrink-0" strokeWidth={1.5} aria-hidden />
            <address className="leading-relaxed not-italic">
              <span className="text-fg-muted block text-xs font-semibold tracking-[0.16em] uppercase">
                Studio
              </span>
              {site.name}
              <br />
              {site.address.street}
              <br />
              {site.address.locality} {site.address.postalCode}, {site.address.countryName}
            </address>
          </div>

          <div className="mt-8 flex gap-4">
            <Clock className="text-accent mt-1 size-5 shrink-0" strokeWidth={1.5} aria-hidden />
            <div className="flex-1">
              <span className="text-fg-muted block text-xs font-semibold tracking-[0.16em] uppercase">
                Working hours
              </span>
              <dl className="mt-1">
                {site.hours.map((entry) => (
                  <div key={entry.days} className="flex justify-between gap-4 py-0.5">
                    <dt>{entry.days}</dt>
                    <dd className="text-fg-muted">{entry.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <h2 className="mt-10 mb-3 text-2xl">Follow the studio</h2>
          <ul className="flex flex-wrap gap-2">
            {site.socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:bg-muted inline-flex min-h-10 items-center rounded-full border px-4 text-sm transition-colors"
                >
                  {social.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Studio location map" className="border-border border-t">
        <iframe
          title={`Map showing ${site.name}, ${addressLine}`}
          src={mapSrc()}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="block h-[28rem] w-full border-0 grayscale-[35%]"
        />
      </section>
    </PageTransition>
  );
}
