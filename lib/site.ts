/** Single source of truth for studio details used across layout, SEO and contact UI. */
export const site = {
  name: "Interiors",
  legalName: "Interiors Design Studio LLP",
  tagline: "Spaces Designed Around You.",
  description:
    "Interiors is a Chennai-based interior design studio creating calm, considered homes and workplaces around the people who use them. Explore our portfolio and book a consultation.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  email: "hello@interiors.example",
  phone: "+91 44 4567 8900",
  phoneHref: "+914445678900",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "914445678900",
  whatsappMessage: "Hello Interiors, I would like to talk about an interior design project.",
  address: {
    street: "22 Khader Nawaz Khan Road, 2nd Floor",
    locality: "Chennai",
    region: "Tamil Nadu",
    postalCode: "600006",
    country: "IN",
    countryName: "India",
  },
  geo: { lat: 13.0606, lng: 80.2496 },
  hours: [
    { days: "Monday – Friday", time: "10:00 – 19:00", schema: "Mo-Fr 10:00-19:00" },
    { days: "Saturday", time: "10:00 – 17:00", schema: "Sa 10:00-17:00" },
    { days: "Sunday", time: "Closed", schema: "" },
  ],
  socials: [
    { name: "Instagram", href: "https://www.instagram.com/" },
    { name: "Pinterest", href: "https://www.pinterest.com/" },
    { name: "LinkedIn", href: "https://www.linkedin.com/" },
    { name: "Facebook", href: "https://www.facebook.com/" },
    { name: "YouTube", href: "https://www.youtube.com/" },
    { name: "Houzz", href: "https://www.houzz.com/" },
  ],
  stats: [
    { label: "Years of practice", value: 14, suffix: "" },
    { label: "Projects delivered", value: 240, suffix: "+" },
    { label: "Cities", value: 9, suffix: "" },
    { label: "Design awards", value: 18, suffix: "" },
  ],
} as const;

export const whatsappLink = (message: string = site.whatsappMessage) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;

export const mainNav = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects", mega: "projects" as const },
  { label: "Services", href: "/services", mega: "services" as const },
  { label: "Materials", href: "/materials" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
];
