import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  Globe,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  serviceCategories,
  serviceCategoryLabels,
  type ServiceCategory,
} from "@repo/contract";
import { Section } from "@/components/section";
import { HowItWorks } from "@/components/page-intro";
import { Icon } from "@/components/icon";
import { Mandala } from "@/components/decor";
import { ServicePrice } from "@/components/price";
import { ServiceCard } from "@/components/sections/service-card";
import { getService, getServices } from "@/lib/api/content";
import { site } from "@/lib/content/site";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const normalize = (category: string): ServiceCategory =>
  (serviceCategories as readonly string[]).includes(category)
    ? (category as ServiceCategory)
    : "other";

/** Prerender the published services; new ones render on demand (dynamicParams). */
export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return { title: "Service not found" };
  return {
    title: service.title,
    description:
      service.summary || `${service.title} — a guidance session at Haarivedon.`,
  };
}

/** Facts true of every session, so the page always carries substance. */
const facts = [
  { icon: Globe, label: "Online, worldwide" },
  { icon: UserRound, label: "One-to-one" },
  { icon: ShieldCheck, label: "Private & confidential" },
  { icon: Sparkles, label: "Personalised to you" },
];

export default async function ServiceDetailPage({
  params,
}: PageProps<"/services/[slug]">) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const category = normalize(service.category);
  const categoryLabel = serviceCategoryLabels[category];
  const contain = /\.png(\?|$)/i.test(service.image);
  const priced =
    service.startingPrice !== null || service.discountedPrice !== null;
  const bookHref = `/book?service=${encodeURIComponent(service.slug)}`;

  const related = (await getServices())
    .filter((s) => s.slug !== service.slug && normalize(s.category) === category)
    .slice(0, 4);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Section background="white" containerClassName="py-8 sm:py-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-charcoal/60">
            <li>
              <Link href="/services" className="transition-colors hover:text-forest">
                Services
              </Link>
            </li>
            {service.category && (
              <>
                <li aria-hidden className="text-charcoal/30">
                  /
                </li>
                <li>
                  <Link
                    href={`/services?category=${category}`}
                    className="transition-colors hover:text-forest"
                  >
                    {categoryLabel}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden className="text-charcoal/30">
              /
            </li>
            <li className="max-w-[12rem] truncate font-medium text-charcoal/80">
              {service.title}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Media */}
          <div className="relative lg:h-full">
            <Mandala
              aria-hidden
              className="pointer-events-none absolute -left-10 -top-10 size-40 text-gold/20"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gradient-to-br from-cream to-soft-yellow/50 shadow-sm ring-1 ring-gold/15 lg:aspect-auto lg:h-full lg:min-h-[24rem]">
              {service.image ? (
                <Image
                  src={service.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 520px"
                  className={
                    contain ? "object-contain p-6 drop-shadow-md" : "object-cover"
                  }
                  priority
                />
              ) : (
                <span className="grid h-full place-items-center">
                  <Icon name={service.icon} className="size-20 text-brand-700/60" />
                </span>
              )}
              {service.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-terracotta px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                  {service.badge}
                </span>
              )}
            </div>
          </div>

          {/* Intro + booking card */}
          <div className="flex flex-col">
            {service.category && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sage/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700">
                {categoryLabel}
              </span>
            )}
            <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-forest sm:text-4xl">
              {service.title}
            </h1>
            {service.summary && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {service.summary}
              </p>
            )}

            {/* Booking — inline on the page, no card. */}
            <div className="mt-6 border-t border-border/60 pt-6">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {priced ? (
                  <ServicePrice
                    rate={service.startingPrice}
                    discounted={service.discountedPrice}
                    currency={service.currency}
                    size="lg"
                  />
                ) : (
                  <span className="font-display text-2xl font-semibold text-forest">
                    By appointment
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Confirmed after you book
                </span>
              </div>

              <Link
                href={bookHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-5 h-12 w-full justify-center px-6 text-sm font-semibold hover:bg-gold hover:text-forest sm:w-auto",
                )}
              >
                Book this session
                <ArrowRight className="size-4" />
              </Link>

              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 text-brand-700" />
                Prefer to talk?{" "}
                <a
                  href={site.phoneHref}
                  className="font-medium text-forest hover:underline"
                >
                  {site.phone}
                </a>
              </p>
            </div>

            {/* Quick facts — always present. */}
            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
              {facts.map((fact) => (
                <li
                  key={fact.label}
                  className="flex items-center gap-2 text-sm text-charcoal/80"
                >
                  <fact.icon aria-hidden className="size-4 shrink-0 text-brand-700" />
                  {fact.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── About + what's included ───────────────────────────────────── */}
      {(service.description || service.highlights.length > 0) && (
        <Section background="cream" containerClassName="py-12 sm:py-16">
          <div
            className={cn(
              "grid gap-10 lg:gap-16",
              service.description &&
                service.highlights.length > 0 &&
                "lg:grid-cols-[1.5fr_1fr]",
            )}
          >
            {service.description && (
              <div className={service.highlights.length > 0 ? undefined : "max-w-3xl"}>
                <h2 className="font-display text-2xl font-semibold text-forest">
                  About this session
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal/80 sm:text-base">
                  {service.description.split("\n\n").map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {service.highlights.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest">
                  What it includes
                </h2>
                <ul className="mt-4 space-y-3">
                  {service.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-ivory/70 p-3.5 text-sm text-charcoal/85"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-600/15 text-brand-700">
                        <Check className="size-3.5" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── How it works — always present ─────────────────────────────── */}
      <Section background="white">
        <HowItWorks
          heading="How a session works"
          steps={[
            {
              title: "Share your details",
              body: "Your name, contact, and when and where you were born.",
            },
            {
              title: "We prepare your chart",
              body: "Your Kundali is drawn up before we speak, so the time is spent on you.",
            },
            {
              title: "We meet over a call",
              body: "We confirm a time that suits you, then the session is yours.",
            },
          ]}
        />
      </Section>

      {/* ── CTA band ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <Mandala
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 size-72 -translate-y-1/2 text-gold/20"
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Ready for your {service.title}?
          </h2>
          <p className="mt-3 max-w-xl text-ivory/70">
            Book a one-to-one session and start the conversation with your actual
            chart, not with questions about it.
          </p>
          <Link
            href={bookHref}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-7 h-12 px-7 text-sm font-semibold shadow-sm hover:bg-gold hover:text-forest",
            )}
          >
            Book this session
            <ArrowRight className="size-4" />
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-ivory/70 transition-colors hover:text-gold"
          >
            <MessageCircle className="size-4" />
            Have a question first? {site.email}
          </a>
        </div>
      </section>

      {/* ── Related ───────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <Section background="cream">
          <h2 className="font-display text-xl font-semibold text-forest">
            More in {categoryLabel}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <ServiceCard service={item} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
