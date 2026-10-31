import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/section";
import { PageIntro } from "@/components/page-intro";
import { getBlogPosts } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on astrology, vastu, numerology and living with intention — from the practice of Neelam A. Singh.",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <PageIntro
        eyebrow="Blog"
        title="Notes & reflections"
        lead="Thoughts on astrology, vastu, numerology and living with intention — written when there's something worth sharing."
      />

      <Section background="ivory">
        {posts.length === 0 ? (
          <p className="mx-auto max-w-prose text-center text-muted-foreground">
            No posts yet — check back soon.
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_45px_-28px_rgba(0,1,66,0.5)]"
                >
                  {post.coverImage && (
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium uppercase tracking-widest text-brand-700">
                      {formatDate(post.publishedAt)}
                    </p>
                    <h2 className="mt-2 font-display text-lg font-semibold leading-snug text-forest">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 text-sm font-medium text-forest underline-offset-4 group-hover:underline">
                      Read more
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
