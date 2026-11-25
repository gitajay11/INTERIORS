# Interiors — interior design studio website

A production-ready marketing site for an interior design studio: a scroll-scrubbed video hero, a project portfolio with photo galleries and before/after sliders, services, a materials library, a journal and a booking flow.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript (strict), Tailwind CSS 4, React Hook Form + Zod, Prisma + PostgreSQL and Resend.

## Quick start

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000. **No environment variables are required to run the site**: every integration has a local fallback.

| Integration         | Without configuration                  | With configuration              |
| ------------------- | -------------------------------------- | ------------------------------- |
| Database (Postgres) | Submissions appended to `.data/*.json` | Saved through Prisma            |
| Email (Resend)      | Logged to the server console           | Sent to client and studio       |
| Turnstile           | Widget and check skipped               | Enforced on booking and contact |
| Google Maps         | Keyless embed                          | Embed API                       |

Copy `.env.example` to `.env.local` and fill in what you need.

## Scripts

| Command                                        | What it does                                        |
| ---------------------------------------------- | --------------------------------------------------- |
| `pnpm dev`                                     | Development server                                  |
| `pnpm build` / `pnpm start`                    | Production build / serve it                         |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint / `tsc --noEmit` / Prettier                  |
| `pnpm test`                                    | Unit and component tests (Vitest + Testing Library) |
| `pnpm test:e2e`                                | Playwright smoke tests against a production build   |
| `pnpm db:push`                                 | Create the tables in the database at `DATABASE_URL` |
| `pnpm db:studio`                               | Browse submissions in Prisma Studio                 |

Husky runs lint-staged (ESLint + Prettier) on commit. Run `git init` first; the `prepare` script installs the hook.

## Project structure

```
app/
  (marketing)/      Home, about, projects, services, materials, book, journal, contact
  api/availability  Free/taken time slots for the booking form
  actions.ts        Server Actions: booking, contact, newsletter
  sitemap.ts, robots.ts, opengraph-image.tsx
components/
  ui/               Button, form fields, Tabs/Accordion/Dialog (Radix, shadcn-style)
  layout/           Header (mega menu), Footer, WhatsAppButton, Providers
  sections/         Page sections and client widgets
  projects/         Explorer, lightbox, before/after slider
  forms/            BookingForm, ContactForm, NewsletterForm, Calendar, Turnstile
lib/                content.ts (content access), data/ (content), validations.ts,
                    surfaces.ts, storage.ts, email.tsx, spam.ts, seo.ts
prisma/             schema.prisma
tests/, e2e/        Vitest and Playwright tests
```

## Home page hero

The hero (`components/sections/HeroScrollVideo.tsx`) is a pinned section about four screens tall. Scrolling plays `public/video/scroll_animation_desktop.mp4` forwards and backwards (`scroll_animation_mobile.mp4` on screens under 768 px wide), with a caption for each room. Visitors with reduced motion, a data saver or a very slow connection get a one-screen hero with `public/images/hero.jpg` instead.

The scroll length is `SECTION_VH`, and the captions and the progress at which they appear are `STOPS`, both at the top of the file. Scrubbing is smoothest when every frame of the video is a keyframe (`ffmpeg -g 1`).

### Adding a material to the library

Add an entry to `lib/data/materials.ts`. Its `surface` draws the swatch image. Available patterns: `planks`, `herringbone`, `marble`, `concrete`, `tiles`, `paint`, `fabric`, `stone`, `terrazzo`. To add a pattern, add a sampler to `SAMPLERS` in `lib/surfaces.ts`.

### Photography

The project photographs are free stock images from [Unsplash](https://unsplash.com/license), standing in for real project photography. Each project has seven files in `public/images/projects/<slug>/`: `cover`, `wide`, `detail`, `side`, `view`, `before` and `after` (JPEG, 3:2, 1600 × 1067). Replace them with your own photographs under the same names, and update the captions in `lib/data/projects.ts` (`shots`). Team and testimonial portraits are monogram placeholders until a `photo` is supplied.

## Database

```bash
# .env.local
DATABASE_URL="postgresql://…neon.tech/…?sslmode=require"
```

```bash
pnpm db:push
```

Models: `Consultation`, `ContactMessage`, `NewsletterSubscriber` (`prisma/schema.prisma`). The Prisma client is generated on install into `lib/generated/prisma`.

## Email

Set `RESEND_API_KEY`, `EMAIL_FROM` (an address on a domain verified in Resend) and `STUDIO_NOTIFICATION_EMAIL`. A booking sends a confirmation to the client and a notification to the studio; the client's optional reference image is attached to the studio email. Templates are in `lib/email.tsx`.

## Spam protection

Every form action runs a honeypot check, a per-IP rate limit (5 requests per 10 minutes) and, when both Turnstile keys are set, a Cloudflare Turnstile verification. The rate limiter is in-memory, so each serverless instance counts separately; swap `lib/rate-limit.ts` for a Redis-backed limiter if you need a hard global limit.

## Content

All content (projects, services, team, testimonials, awards, materials, journal posts) lives in `lib/data`. Pages read it through `lib/content.ts`, so the source can be swapped for a CMS or database later without touching the pages. Edit the files in `lib/data` and redeploy to change what the site shows.

## Performance notes

- **Page content is in the first paint.** Each `page.tsx` wraps its content in `<PageTransition>`; keep that wrapper in pages, not layouts. A layout-level wrapper has to sit in a Suspense boundary, and React streams large boundaries in after the first paint, which made the footer flash at the top of every page.
- **Filterable grids render on the server.** The Projects, Materials and Journal explorers read the query string, so they suspend during the static prerender. Their fallback is the unfiltered view itself rather than a loading message, so the grid is in the HTML and nothing shifts when the live version takes over.
- **Procedural textures are generated in a Web Worker** (`lib/surface.worker.ts`, used through `lib/surface-client.ts`). Use `loadSurfaceTextures` or `generateSurfaceAsync` for anything that needs more than one surface at a time.
- **GSAP and TanStack Query load only where used** (the home page timeline, after load; the booking page).
- **Start-up timings** for the walkthrough are recorded as User Timing marks (`tour:module-loaded`, `tour:scene-built`, `tour:first-frame-drawn`, `tour:ready`), visible in the Timings track of the DevTools Performance panel.
- Hero images use `preload` (Next 16 deprecated `priority`).

## SEO and accessibility

- Per-page metadata and canonical URLs, `sitemap.xml`, `robots.txt`, a generated Open Graph image.
- JSON-LD: `LocalBusiness` site-wide, `Article` per post, `CreativeWork` per project, `FAQPage` per service, breadcrumbs. schema.org has no `InteriorDesigner` type, so the business is typed `LocalBusiness` + `ProfessionalService`.
- Skip link, visible focus states, labelled controls, 44 px touch targets, keyboard-operable carousels, lightbox and sliders, and `prefers-reduced-motion` respected by every animation and by smooth scrolling.

## Deploying to Vercel

1. Push the repository to GitHub and import it at https://vercel.com/new (framework preset: Next.js; no build settings to change).
2. Add the environment variables from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
3. Create a Neon database (Vercel → Storage, or neon.tech), set `DATABASE_URL`, and run `pnpm db:push` once against it.
4. Deploy. Vercel Analytics and Speed Insights activate automatically when enabled in the project dashboard.

A database is required in production: the JSON fallback cannot write on a serverless filesystem, so form submissions would fail without `DATABASE_URL`.

## Things to change before launch

- Studio details, phone, address, hours and social links in `lib/site.ts`.
- Demo projects, team, testimonials, awards and journal posts (`lib/data`).
- The stock photographs in `public/images`, the two videos in `public/video` and the studio's address, phone and email are placeholders.
