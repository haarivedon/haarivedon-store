import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BookingBand() {
  return (
    <section className="bg-ivory">
      <div className="mx-auto grid max-w-screen-2xl items-stretch overflow-hidden border border-border bg-card md:grid-cols-2">
        <div className="flex flex-col justify-center gap-5 p-8 sm:p-12 lg:p-14">
          <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-forest sm:text-4xl">
            Sometimes, clarity begins with a conversation.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Book your session today and take the first step toward a more
            balanced and fulfilling life.
          </p>
          <div>
            <Link
              href="/book"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full px-7 text-sm font-semibold shadow-sm hover:bg-gold-600",
              )}
            >
              Book Your Session
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="relative min-h-[320px] md:min-h-full">
          <Image
            src="/images/founder-booking-wide.jpg"
            alt="Neelam Niranjan in quiet focus, holding a crystal sphere in her garden"
            fill
            sizes="(max-width: 768px) 100vw, 760px"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
