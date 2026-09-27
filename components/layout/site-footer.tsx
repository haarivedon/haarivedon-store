import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { navLinks, site } from "@/lib/content/site";

const socials = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.83s0 3.57-.07 4.83c-.05 1.17-.25 1.8-.41 2.23a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.57 2.2 15.19 2.2 12s0-3.57.07-4.83c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.44 2.21 8.82 2.2 12 2.2Zm0 1.8c-3.14 0-3.5 0-4.74.07-.9.04-1.38.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.33-.28.81-.32 1.71C3.4 8.5 3.4 8.86 3.4 12s0 3.5.07 4.74c.04.9.19 1.38.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.33.13.81.28 1.71.32 1.24.07 1.6.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.33.28-.81.32-1.71.07-1.24.07-1.6.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.33-.13-.81-.28-1.71-.32C15.5 4 15.14 4 12 4Zm0 3.05A4.95 4.95 0 1 1 12 17a4.95 4.95 0 0 1 0-9.9Zm0 1.8a3.15 3.15 0 1 0 0 6.3 3.15 3.15 0 0 0 0-6.3Zm5.15-.9a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919876543210",
    path: "M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.34A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 0 1 6.98 12.5.9.9 0 0 0-.1.7l.63 2.3-2.37-.62a.9.9 0 0 0-.68.09A8.2 8.2 0 1 1 12 3.8Zm-3 3.3c-.15 0-.4.06-.6.3-.22.24-.83.81-.83 1.98s.85 2.3.97 2.46c.12.16 1.68 2.7 4.15 3.68 2.05.8 2.47.65 2.92.6.45-.04 1.44-.58 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.44-.71-1.66-.79-.22-.08-.38-.12-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.32-.76-1.8-.18-.42-.37-.42-.55-.42h-.5Z",
  },
];

const footerNav = [...navLinks, { label: "Book a Session", href: "/book" }];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-ivory/80">
      <div className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-ivory/60">
              Ancient wisdom and personalized guidance for life&rsquo;s important
              decisions. Let&rsquo;s walk your path toward clarity, together.
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="font-display text-base text-ivory">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ivory/65 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="font-display text-base text-ivory">Follow Us</h3>
            <div className="mt-4 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid size-10 place-items-center rounded-full border border-ivory/15 text-ivory/70 transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-base text-ivory">Get in Touch</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-2.5 text-ivory/65 transition-colors hover:text-gold"
                >
                  <Mail className="size-4 shrink-0 text-gold" />
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={site.phoneHref}
                  className="flex items-center gap-2.5 text-ivory/65 transition-colors hover:text-gold"
                >
                  <Phone className="size-4 shrink-0 text-gold" />
                  {site.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/50 sm:flex-row">
          <p>© 2026 Haarivedon. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gold">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
