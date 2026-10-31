import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarCheck, CheckCircle2, FileText } from "lucide-react";
import { Section } from "@/components/section";
import { KundaliDownload } from "@/components/forms/kundali-download";
import { BookingContinue } from "@/components/forms/booking-continue";
import { api } from "@/lib/api/client";
import { getSiteContent } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Your session",
  robots: { index: false, follow: false },
};

/**
 * Steps 4+ of the booking wizard, at a shareable, bookmarkable URL.
 * Not paid → schedule + pay (BookingContinue). Paid → the confirmation, with
 * the Kundali download. A reload always resumes on the right step.
 */
export default async function BookingPage({
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

  if (booking.paymentStatus !== "paid") {
    // The URL always carries the step. Land without one → redirect to add it,
    // choosing by state so a reload resumes correctly.
    const step =
      query.step === "schedule" || query.step === "pay" ? query.step : null;
    if (!step) {
      const wanted = booking.scheduled ? "pay" : "schedule";
      redirect(`/book/${id}?token=${token}&step=${wanted}`);
    }
    return (
      <Section background="ivory" containerClassName="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <BookingContinue
            booking={booking}
            token={token}
            fee={copy.fee}
            calendlyUrl={copy.calendlyUrl?.trim() ?? ""}
            step={step}
          />
        </div>
      </Section>
    );
  }

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
          Payment confirmed{booking.service ? ` for ${booking.service}` : ""}.
          Bookmark this page — you can return to it any time.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-600/30 bg-brand-600/5 p-5">
          <CalendarCheck className="mt-0.5 size-5 shrink-0 text-brand-700" />
          <p className="text-sm text-charcoal/80">
            {booking.scheduled ? (
              <>
                Your session time is booked — check your email for the Calendly
                confirmation and calendar invite.
              </>
            ) : (
              <>We&rsquo;ll reach out shortly to confirm a time that suits you.</>
            )}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-forest">
            <FileText className="size-5 text-brand-700" />
            Your Kundali
          </h2>
          <div className="mt-3">
            <KundaliDownload id={booking.id} token={token} />
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
