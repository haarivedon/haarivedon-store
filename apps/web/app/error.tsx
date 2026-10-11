"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Branded error boundary.
 *
 * Deliberately says nothing about what failed: the detail is in the server
 * logs, and a stack trace on a public page helps nobody but an attacker.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center bg-ivory px-4 py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-2xl font-semibold text-forest sm:text-3xl">
          Something went wrong at our end
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Nothing you did caused this. Try again in a moment — and if you were
          sending us something, it may not have reached us.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            <RotateCw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-charcoal/85 hover:border-brand-600"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
