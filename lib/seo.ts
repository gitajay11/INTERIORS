import type { Metadata } from "next";
import { site } from "@/lib/site";
import type { Post, Project, TeamMember } from "@/lib/types";

const abs = (path: string) => (path.startsWith("http") ? path : `${site.url}${path}`);

/** Per-page metadata with canonical URL and Open Graph defaults filled in. */
export function pageMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} — ${site.name}`,
      description,
      url: path,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

/** schema.org LocalBusiness (InteriorDesigner is not a schema.org type, so it is expressed via additionalType). */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": `${site.url}/#studio`,
    additionalType: "https://www.wikidata.org/wiki/Q2133344", // interior designer
    name: site.name,
    legalName: site.legalName,
    description: site.description,
    url: site.url,
    image: abs("/opengraph-image"),
    telephone: site.phoneHref,
    email: site.email,
    priceRange: "₹₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
    openingHours: site.hours.map((entry) => entry.schema).filter(Boolean),
    sameAs: site.socials.map((social) => social.href),
    knowsAbout: [
      "Interior design",
      "Space planning",
      "Lighting design",
      "Furniture selection",
      "Renovation",
    ],
  };
}

export function articleJsonLd(post: Post, author: TeamMember | undefined) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: [abs(post.coverImage.src)],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    articleSection: post.category,
    mainEntityOfPage: abs(`/journal/${post.slug}`),
    author: { "@type": "Person", name: author?.name ?? site.name, jobTitle: author?.role },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };
}

export function projectJsonLd(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    image: [abs(project.coverImage.src), ...project.gallery.map((image) => abs(image.src))],
    dateCreated: String(project.year),
    locationCreated: { "@type": "Place", name: project.location },
    creator: { "@id": `${site.url}/#studio` },
    url: abs(`/projects/${project.slug}`),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
