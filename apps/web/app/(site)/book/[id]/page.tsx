import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, FileText } from "lucide-react";
import { Section } from "@/components/section";
import { KundaliDownload } from "@/components/forms/kundali-download";
import { CalendlyScheduler } from "@/components/forms/calendly-scheduler";
import { api } from "@/lib/api/client";
import { getSiteContent } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Your session",
  robots: { index: false, follow: false },
};

/**
 * Shareable, bookmarkable booking confirmation — reachable after payment at
 * /book/[id]?token=…. Shows the Kundali download and the Calendly scheduler so
 * the booker can pick a slot, leave, and return to the same URL any time.
 */
export default async function BookingConfirmationPage({
  params,
  searchParams,
}: PageProps<"/book/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const token = typeof query.token === "string" ? query.token : "";
  if (!token) notFound();

  const [response, copy] = await Promise.all([
    api.bookings.get({ params: { id }, query: { token } }),
    getSiteContent("book.page"),
  ]);
  if (response.status !== 200) notFound();

  const booking = response.body;
  const firstName = booking.name.split(" ")[0] ?? booking.name;
  const calendlyUrl = copy.calendlyUrl?.trim() ?? "";

  return (
    <Section background="ivory" containerClassName="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
          Booking {booking.reference || booking.id.slice(-6).toUpperCase()}
        </p>
        <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold text-forest">
          <CheckCircle2 className="size-7 text-brand-600" />
          You&rsquo;re booked, {firstName}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {booking.paymentStatus === "paid"
            ? "Your payment is confirmed."
            : "We're confirming your payment."}{" "}
          {booking.service
            ? `Session: ${booking.service}. `
            : ""}
          Pick a time below, and download your Kundali once it&rsquo;s ready.
          Bookmark this page — you can return to it any time.
        </p>

        {/* Kundali */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
            <FileText className="size-5 text-brand-700" />
            Your Kundali
          </h2>
          <div className="mt-3">
            <KundaliDownload id={booking.id} token={token} />
          </div>
        </div>

        {/* Scheduling */}
        <div className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
            <CalendarClock className="size-5 text-brand-700" />
            Pick your session time
          </h2>
          <div className="mt-3">
            {calendlyUrl ? (
              <CalendlyScheduler url={calendlyUrl} name={booking.name} />
            ) : (
              <p className="rounded-2xl border border-border/60 bg-cream/40 p-5 text-sm text-charcoal/80">
                We&rsquo;ll reach out shortly to confirm a time that suits you.
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Questions? Reply to your confirmation or{" "}
          <Link href="/#contact" className="font-medium text-forest underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
