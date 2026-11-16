"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";
import { ArrowUpRight, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { mainNav, site } from "@/lib/site";
import { PROJECT_CATEGORIES, type ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface HeaderProps {
  services: { slug: string; title: string; summary: string }[];
  featured: { slug: string; title: string; location: string; image: ImageAsset }[];
}

export function Header({ services, featured }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The header is a floating glass bar. Over the home hero it is a clear,
  // light-on-dark glass; everywhere else (and once scrolled, or while a mega
  // menu is open) it is frosted in the page colour.
  const overHero = pathname === "/" && !scrolled && !megaOpen;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const megaLinkClass =
    "hover:bg-muted focus-visible:bg-muted block rounded-sm p-3 transition-colors";

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4"
      // Anchored during page transitions, so only the content below it moves.
      style={{ viewTransitionName: "site-header" }}
    >
      <a
        href="#main"
        className="bg-fg text-bg sr-only z-50 rounded-sm px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div
        className={cn(
          "pointer-events-auto relative mx-auto flex h-16 max-w-[84rem] items-center justify-between gap-4 rounded-full border pr-2.5 pl-6 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,color,box-shadow] duration-300 sm:pr-3 sm:pl-8 lg:pl-6 xl:gap-6 xl:pl-8",
          overHero
            ? "border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_32px_-12px_rgb(0_0_0/0.45)]"
            : "text-fg bg-bg/65 border-white/50 shadow-[inset_0_1px_0_rgb(255_255_255/0.55),0_10px_36px_-14px_rgb(43_41_38/0.3)] dark:border-white/10 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_10px_36px_-14px_rgb(0_0_0/0.7)]",
        )}
      >
        <Link
          href="/"
          className="shrink-0 font-serif text-xl tracking-wide whitespace-nowrap sm:text-[1.375rem]"
          aria-label={`${site.name} — home`}
        >
          Interiors
        </Link>

        {/* ---- Desktop navigation ---- */}
        <NavigationMenu.Root
          className="hidden lg:block"
          value={megaOpen}
          onValueChange={setMegaOpen}
          delayDuration={80}
        >
          <NavigationMenu.List className="flex items-center xl:gap-1">
            {mainNav.map((item) => {
              const linkClass = cn(
                // Tighter between 1024 and 1280 px, where seven links share the bar with the logo and the button.
                "flex h-10 items-center gap-1 rounded-full px-2.5 text-sm font-medium whitespace-nowrap transition-colors xl:px-3.5",
                overHero ? "hover:bg-white/15" : "hover:bg-fg/8",
                isActive(item.href) &&
                  "underline decoration-accent decoration-2 underline-offset-8",
              );
              if (!item.mega) {
                return (
                  <NavigationMenu.Item key={item.href}>
                    <NavigationMenu.Link asChild active={isActive(item.href)}>
                      <Link href={item.href} className={linkClass}>
                        {item.label}
                      </Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                );
              }
              return (
                <NavigationMenu.Item key={item.href} value={item.mega}>
                  <NavigationMenu.Trigger className={cn(linkClass, "group")}>
                    {item.label}
                    <ChevronDown
                      className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
                      aria-hidden
                    />
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="text-fg animate-fade-in absolute top-0 left-0 w-full">
                    {item.mega === "services" ? (
                      <div className="grid grid-cols-3 gap-8 p-8">
                        <ul className="col-span-2 grid grid-cols-2 gap-1">
                          {services.map((service) => (
                            <li key={service.slug}>
                              <NavigationMenu.Link asChild>
                                <Link href={`/services/${service.slug}`} className={megaLinkClass}>
                                  <span className="font-serif text-lg">{service.title}</span>
                                  <span className="text-fg-muted mt-0.5 block text-sm">
                                    {service.summary}
                                  </span>
                                </Link>
                              </NavigationMenu.Link>
                            </li>
                          ))}
                        </ul>
                        <div className="bg-muted flex flex-col justify-between rounded-sm p-6">
                          <div>
                            <p className="eyebrow">Not sure where to start?</p>
                            <p className="mt-3 font-serif text-2xl">
                              A one-hour consultation answers most questions.
                            </p>
                          </div>
                          <NavigationMenu.Link asChild>
                            <Link
                              href="/book"
                              className="text-accent mt-6 inline-flex items-center gap-1 text-sm font-medium"
                            >
                              Book a consultation <ArrowUpRight className="size-4" aria-hidden />
                            </Link>
                          </NavigationMenu.Link>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-8 p-8">
                        <div>
                          <p className="eyebrow mb-3">By type</p>
                          <ul className="space-y-1">
                            {[
                              { label: "All projects", href: "/projects" },
                              { label: "Residential", href: "/projects?type=residential" },
                              { label: "Commercial", href: "/projects?type=commercial" },
                            ].map((link) => (
                              <li key={link.href}>
                                <NavigationMenu.Link asChild>
                                  <Link
                                    href={link.href}
                                    className={cn(megaLinkClass, "font-serif text-lg")}
                                  >
                                    {link.label}
                                  </Link>
                                </NavigationMenu.Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="eyebrow mb-3">By space</p>
                          <ul className="grid grid-cols-2 gap-x-2">
                            {PROJECT_CATEGORIES.map((category) => (
                              <li key={category}>
                                <NavigationMenu.Link asChild>
                                  <Link
                                    href={`/projects?category=${category}`}
                                    className="hover:text-accent flex min-h-9 items-center px-3 text-sm transition-colors"
                                  >
                                    {category}
                                  </Link>
                                </NavigationMenu.Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {featured.slice(0, 2).map((project) => (
                          <NavigationMenu.Link asChild key={project.slug}>
                            <Link href={`/projects/${project.slug}`} className="group/card block">
                              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-sm">
                                <Image
                                  src={project.image.src}
                                  alt={project.image.alt}
                                  fill
                                  sizes="280px"
                                  className="object-cover transition-transform duration-700 group-hover/card:scale-105"
                                />
                              </div>
                              <p className="mt-3 font-serif text-lg">{project.title}</p>
                              <p className="text-fg-muted text-sm">{project.location}</p>
                            </Link>
                          </NavigationMenu.Link>
                        ))}
                      </div>
                    )}
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              );
            })}
          </NavigationMenu.List>
          {/* Positioned against the glass bar, not the nav list, so the panel
              spans the bar. Content is absolutely positioned, so the viewport
              must take its height from the variable Radix measures. */}
          <div className="absolute inset-x-0 top-full flex justify-center pt-3">
            <NavigationMenu.Viewport className="border-border bg-surface shadow-soft animate-fade-in relative h-(--radix-navigation-menu-viewport-height) w-full max-w-5xl overflow-hidden rounded-3xl border transition-[height] duration-200" />
          </div>
        </NavigationMenu.Root>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle
            className={cn("rounded-full", overHero ? "hover:bg-white/15" : "hover:bg-fg/8")}
          />
          <Button
            asChild
            size="sm"
            variant={overHero ? "light" : "primary"}
            className="hidden shrink-0 rounded-full px-5 sm:inline-flex lg:px-4 xl:px-5"
          >
            <Link href="/book" aria-label="Book consultation">
              <span className="lg:hidden xl:inline">Book consultation</span>
              <span className="hidden lg:inline xl:hidden">Book a call</span>
            </Link>
          </Button>

          {/* ---- Mobile navigation ---- */}
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex size-11 items-center justify-center rounded-full lg:hidden",
                  overHero ? "hover:bg-white/15" : "hover:bg-fg/8",
                )}
                aria-label="Open menu"
              >
                <Menu className="size-5" aria-hidden />
              </button>
            </DialogTrigger>
            <DialogContent side="right" label="Site navigation" className="flex flex-col p-6 pt-16">
              <nav aria-label="Mobile">
                <ul className="divide-border divide-y">
                  {[{ label: "Home", href: "/" }, ...mainNav].map((item) => (
                    <li key={item.href}>
                      <DialogClose asChild>
                        <Link
                          href={item.href}
                          className="flex min-h-14 items-center justify-between font-serif text-2xl"
                          aria-current={pathname === item.href ? "page" : undefined}
                        >
                          {item.label}
                          <ArrowUpRight className="text-accent size-4" aria-hidden />
                        </Link>
                      </DialogClose>
                    </li>
                  ))}
                </ul>
              </nav>
              <DialogClose asChild>
                <Button asChild size="lg" variant="accent" className="mt-8">
                  <Link href="/book">Book a consultation</Link>
                </Button>
              </DialogClose>
              <p className="text-fg-muted mt-6 text-sm">
                <a href={`tel:${site.phoneHref}`} className="block py-1">
                  {site.phone}
                </a>
                <a href={`mailto:${site.email}`} className="block py-1">
                  {site.email}
                </a>
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
