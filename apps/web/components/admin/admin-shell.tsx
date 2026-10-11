"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  PanelsTopLeft,
  ShoppingBag,
  Sparkles,
  Stars,
  X,
} from "lucide-react";
import {
  siteContentKeys,
  siteContentLabels,
  type AdminUser,
} from "@repo/contract";
import { adminApi } from "@/lib/api/admin-client";
import { cn } from "@/lib/utils";

export type PendingCounts = {
  bookings: number;
  predictions: number;
  enquiries: number;
};

type Item = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
};

/**
 * Admin shell: a persistent sidebar rather than a top bar.
 *
 * There are fourteen destinations across four groups (content, images,
 * inbox, page copy) — more than a row of tabs can hold without a dropdown,
 * and a dropdown hides exactly the thing the client needs to find. The
 * sidebar keeps every section one click away and leaves the header free for
 * the page title and its actions.
 *
 * Below `lg` it collapses to a drawer, because the inbox is the part that
 * gets checked from a phone.
 */
export function AdminShell({
  user,
  counts,
  children,
}: {
  user: AdminUser | null;
  counts: PendingCounts;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Lock the page behind the drawer. Without this the content scrolls under
  // the open menu on a phone, which reads as the sidebar scrolling away.
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Sign-in has no chrome: there is nothing to navigate to yet.
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#f6f5ef]">{children}</div>;
  }

  const groups: { heading: string; items: Item[] }[] = [
    {
      heading: "Overview",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      heading: "Content",
      items: [
        { href: "/admin/content/courses", label: "Courses", icon: GraduationCap },
        { href: "/admin/content/products", label: "Products", icon: ShoppingBag },
        { href: "/admin/content/services", label: "Services", icon: Sparkles },
        {
          href: "/admin/content/testimonials",
          label: "Testimonials",
          icon: MessageSquareQuote,
        },
        { href: "/admin/media", label: "Images", icon: Images },
      ],
    },
    {
      heading: "Inbox",
      items: [
        {
          href: "/admin/inbox/bookings",
          label: "Bookings",
          icon: Inbox,
          badge: counts.bookings,
        },
        {
          href: "/admin/inbox/predictions",
          label: "Predictions",
          icon: Stars,
          badge: counts.predictions,
        },
        {
          href: "/admin/inbox/enquiries",
          label: "Course enquiries",
          icon: BookOpen,
          badge: counts.enquiries,
        },
      ],
    },
    {
      heading: "Page copy",
      items: siteContentKeys.map((key) => ({
        href: `/admin/copy/${key}`,
        label: siteContentLabels[key],
        icon: FileText,
      })),
    },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function signOut() {
    setSigningOut(true);
    await adminApi.logout({ body: {} });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-forest text-ivory">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <PanelsTopLeft className="size-5 text-gold" />
          <span className="font-display text-lg font-semibold leading-none">
            Haarivedon
            <span className="mt-0.5 block text-[0.65rem] font-normal uppercase tracking-[0.18em] text-gold">
              Content admin
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="grid size-9 place-items-center rounded-lg text-ivory/70 hover:bg-ivory/10 lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group.heading} className="mb-5">
            <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ivory/45">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-ivory/15 font-semibold text-ivory"
                          : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-gold" : "text-ivory/55",
                        )}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-gold px-1.5 py-0.5 text-[0.65rem] font-bold text-charcoal">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-ivory/15 px-4 py-4">
        {user && (
          <p className="truncate text-xs text-ivory/60" title={user.email}>
            Signed in as {user.email}
          </p>
        )}
        <div className="mt-2.5 flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-lg border border-ivory/20 px-3 py-2 text-center text-xs font-medium text-ivory/85 hover:bg-ivory/10"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ivory/20 px-3 py-2 text-xs font-medium text-ivory/85 hover:bg-ivory/10 disabled:opacity-60"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f5ef] lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen overflow-y-auto overscroll-contain lg:block">
        {sidebar}
      </aside>

      {/*
        Mobile bar + drawer.

        Fixed rather than sticky: sticky depends on every ancestor keeping
        `overflow: visible` and on the parent box staying in view, which is
        fragile inside a layout that becomes a grid at `lg`. Fixed pins it
        unconditionally; `<main>` carries matching top padding so nothing
        hides underneath.
      */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 bg-forest px-4 py-3 text-ivory shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-lg border border-ivory/25"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-display text-base font-semibold">
          Haarivedon admin
        </span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-charcoal/50"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto overscroll-contain shadow-xl">
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 pb-10 pt-20 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
