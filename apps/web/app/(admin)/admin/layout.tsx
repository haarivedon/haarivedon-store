import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";

/** The admin is never indexed, and never statically rendered. */
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Haarivedon Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-cream/40">
      <AdminNav />
      <main className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
