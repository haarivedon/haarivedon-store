import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getAdminUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  // Already signed in: go where they were headed (PLAN.md §13).
  const user = await getAdminUser();
  const { next } = await searchParams;
  const target = typeof next === "string" && next.startsWith("/admin") ? next : "/admin";
  if (user) redirect(target);

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-2xl font-semibold text-forest">
        Sign in
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        The Haarivedon content admin.
      </p>
      <div className="mt-6 rounded-2xl border border-border/70 bg-white p-6 shadow-[0_1px_2px_rgba(32,38,31,0.04)]">
        <LoginForm next={target} />
      </div>
    </div>
  );
}
