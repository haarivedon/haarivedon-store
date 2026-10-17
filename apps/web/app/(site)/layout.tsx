import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { CartProvider } from "@/lib/cart/cart-context";
import { getSiteContent, orFallback } from "@/lib/api/content";
import { site } from "@/lib/content/site";

/**
 * Chrome for the public site only.
 *
 * This used to live in the root layout, which meant the admin inherited the
 * marketing header and footer. Route groups share the root document but get
 * their own shell, so `(site)` carries the nav and `(admin)` carries the
 * sidebar — neither sees the other's.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const contact = await getSiteContent("site.contact");

  return (
    <CartProvider>
      <OrganizationJsonLd
        phone={orFallback(contact.phone, site.phone)}
        email={orFallback(contact.email, site.email)}
      />
      <AnnouncementBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
