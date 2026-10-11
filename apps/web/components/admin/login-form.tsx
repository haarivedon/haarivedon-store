"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { loginSchema } from "@repo/contract";
import { adminApi } from "@/lib/api/admin-client";
import { toFieldErrors, type FieldErrors } from "@/lib/forms";
import { Field, inputClass } from "@/components/forms/field";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await adminApi.login({ body: parsed.data });
      if (response.status === 200) {
        router.push(next);
        router.refresh();
        return;
      }
      const body = response.body as { error?: string } | undefined;
      setErrors({ _: body?.error ?? "Sign-in failed. Please try again." });
    } catch {
      setErrors({ _: "We couldn't reach the server. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          className={inputClass}
        />
      </Field>

      {errors._ && (
        <p role="alert" className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(buttonVariants({ size: "lg" }), "disabled:opacity-70")}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Forgotten the password? It can be reset on the server with
        <code className="mx-1 rounded bg-cream px-1 py-0.5">pnpm db:seed:admin</code>
        — see docs/BUILD.md.
      </p>
    </form>
  );
}
