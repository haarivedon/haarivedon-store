"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Mail, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { marqueeWords, navLinks, site } from "@/lib/content/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header>
      {/* ── Tier 1: dark brand bar ─────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-forest text-ivory lg:static">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo tone="light" />

          {/* Trust words (desktop) */}
          <div className="hidden items-center gap-6 text-xs tracking-wide text-ivory/70 xl:flex">
            {marqueeWords.map((word) => (
              <span key={word} className="flex items-center gap-2">
                <span className="text-gold">✦</span>
                {word}
              </span>
            ))}
          </div>

          {/* Contact (desktop) */}
          <div className="hidden items-center gap-5 text-sm lg:flex">
            <a
              href={site.phoneHref}
              className="flex items-center gap-2 text-ivory/80 transition-colors hover:text-gold"
            >
              <Phone className="size-4 text-gold" />
              {site.phone}
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-2 text-ivory/80 transition-colors hover:text-gold"
            >
              <Mail className="size-4 text-gold" />
              {site.email}
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-ivory/25 text-ivory lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* ── Tier 2: light navigation tabs (sticky on desktop) ──────────── */}
      <div className="hidden border-b border-border bg-ivory/95 backdrop-blur-md lg:sticky lg:top-0 lg:z-40 lg:block lg:shadow-sm">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
          <nav className="flex items-center" aria-label="Main">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-4 py-3.5 text-sm font-medium transition-colors",
                    active
                      ? "text-forest"
                      : "text-charcoal/70 hover:text-forest",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gold transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <Link
            href="/book"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 px-5 text-sm font-semibold shadow-sm",
            )}
          >
            Book a Session
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* ── Mobile menu ────────────────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden">
          <nav
            className="flex flex-col gap-1 border-b border-border bg-ivory px-4 py-4 shadow-lg"
            aria-label="Mobile"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-sage/50 text-forest"
                    : "text-charcoal/85 hover:bg-sage/50 hover:text-forest",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book"
              onClick={() => setOpen(false)}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-2 h-12 text-sm font-semibold",
              )}
            >
              Book a Session
              <ArrowRight className="size-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
