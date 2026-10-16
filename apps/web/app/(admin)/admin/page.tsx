import Link from "next/link";
import type { Metadata } from "next";
import { adminFetch, requireAdminUser } from "@/lib/admin/session";
import { PageHeader, Panel } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Overview" };

type Paged = { meta: { total: number } };

/** Counts for the overview tiles; a failed call shows a dash, not an error. */
async function count(path: string): Promise<number | null> {
  const result = await adminFetch<Paged>(`${path}?perPage=1`);
  return result?.meta.total ?? null;
}

export default async function AdminHome() {
  const user = await requireAdminUser("/admin");

  const [courses, drafts, products, bookings, predictions, enquiries] =
    await Promise.all([
      count("/courses?published=true"),
      count("/courses?published=false"),
      count("/products?published=true"),
      count("/bookings?status=pending"),
      count("/predictions?status=pending"),
      count("/enquiries?status=pending"),
    ]);

  const tiles = [
    { label: "Published courses", value: courses, href: "/admin/content/courses" },
    { label: "Course drafts", value: drafts, href: "/admin/content/courses" },
    { label: "Published products", value: products, href: "/admin/content/products" },
    { label: "New bookings", value: bookings, href: "/admin/inbox/bookings" },
    { label: "New prediction requests", value: predictions, href: "/admin/inbox/predictions" },
    { label: "New enquiries", value: enquiries, href: "/admin/inbox/enquiries" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name}` : ""}`}
        description="Anything you have not published yet stays invisible on the site, so you can fill things in over time."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Link
              href={tile.href}
              className="flex h-full flex-col border border-l-2 border-border border-l-gold bg-white p-5 transition-colors hover:border-brand-600 hover:border-l-gold"
            >
              <span className="font-display text-3xl font-semibold text-forest">
                {tile.value ?? "—"}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {tile.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Panel className="mt-10 p-5">
        <h2 className="font-display text-lg font-semibold text-forest">
          Publishing a course
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-charcoal/80">
          <li>Open <strong>Courses</strong> and pick one from the list.</li>
          <li>Write the summary and description, and set the duration.</li>
          <li>Upload an image and give it alt text — a sentence describing it.</li>
          <li>Set a price, or leave it empty to show &ldquo;Enquire for price&rdquo;.</li>
          <li>Switch <strong>Published</strong> on and save.</li>
        </ol>
        <p className="mt-3 text-sm text-muted-foreground">
          If something is missing, saving will tell you exactly which field it
          is rather than publishing a half-finished page.
        </p>
      </Panel>
    </div>
  );
}
