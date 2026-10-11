import type { Course, Product, Service } from "@repo/contract";

const BASE = "https://haarivedon.com";

/**
 * Structured data, rendered as a plain script tag — JSON.stringify of a typed
 * object is the whole job, so there is no library here.
 *
 * Every claim stays descriptive: these schemas say what is offered, never
 * that it produces a result (docs/PLAN.md §2).
 */
function Script({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own database, and JSON.stringify escapes them.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd({
  phone,
  email,
}: {
  phone: string;
  email: string;
}) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Haarivedon",
        url: BASE,
        description:
          "Ancient wisdom and personalized guidance — consultations, readings, courses and sacred tools.",
        founder: { "@type": "Person", name: "Neelam Niranjan" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: phone,
          email,
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
      }}
    />
  );
}

export function ServiceJsonLd({ services }: { services: Service[] }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: services.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: service.title,
            description: service.summary,
            provider: { "@type": "Organization", name: "Haarivedon" },
            ...(service.startingPrice !== null && {
              offers: {
                "@type": "Offer",
                price: service.startingPrice,
                priceCurrency: service.currency,
              },
            }),
          },
        })),
      }}
    />
  );
}

export function ProductJsonLd({ product }: { product: Product }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.summary || product.description,
        ...(product.images[0] && { image: product.images[0] }),
        ...(product.price !== null && {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: product.currency,
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${BASE}/products/${product.slug}`,
          },
        }),
      }}
    />
  );
}

export function CourseJsonLd({ course }: { course: Course }) {
  return (
    <Script
      data={{
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.summary || course.description,
        url: `${BASE}/courses/${course.slug}`,
        inLanguage: course.language,
        provider: { "@type": "Organization", name: "Haarivedon", url: BASE },
        ...(course.price !== null && {
          offers: {
            "@type": "Offer",
            price: course.price,
            priceCurrency: course.currency,
            category: "Paid",
          },
        }),
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: course.format === "recorded" ? "Online" : "Blended",
          ...(course.duration && { courseWorkload: course.duration }),
        },
      }}
    />
  );
}
