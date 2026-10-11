"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { siteContentKeys, siteContentLabels } from "@repo/contract";
import { adminApi } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/content/courses", label: "Courses" },
  { href: "/admin/content/products", label: "Products" },
  { href: "/admin/content/services", label: "Services" },
  { href: "/admin/content/testimonials", label: "Testimonials" },
  { href: "/admin/media", label: "Images" },
  { href: "/admin/inbox/bookings", label: "Inbox" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (pathname === "/admin/login") return null;

  async function signOut() {
    setSigningOut(true);
    await adminApi.logout({ body: {} });
    router.push("/admin/login");
  }

  return (
    <header className="border-b border-border bg-forest text-ivory">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="font-display text-lg font-semibold">
          Haarivedon
          <span className="ml-2 text-xs font-normal uppercase tracking-widest text-gold">
            Admin
          </span>
        </Link>

        <nav aria-label="Admin" className="flex flex-wrap items-center gap-1">
          {sections.map((section) => {
            const active =
              section.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(section.href.split("/").slice(0, 4).join("/"));
            return (
              <Link
                key={section.href}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-ivory/15 text-ivory"
                    : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory",
                )}
              >
                {section.label}
              </Link>
            );
          })}

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-sm font-medium text-ivory/75 hover:bg-ivory/10 hover:text-ivory">
              Page copy
            </summary>
            <div className="absolute left-0 z-30 mt-1 w-56 rounded-xl border border-border bg-popover p-1 shadow-lg">
              {siteContentKeys.map((key) => (
                <Link
                  key={key}
                  href={`/admin/copy/${key}`}
                  className="block rounded-lg px-3 py-2 text-sm text-charcoal hover:bg-sage/40"
                >
                  {siteContentLabels[key]}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-medium text-ivory/70 underline underline-offset-2 hover:text-ivory"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ivory/25 px-3 py-1.5 text-xs font-medium text-ivory/85 hover:bg-ivory/10 disabled:opacity-60"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
