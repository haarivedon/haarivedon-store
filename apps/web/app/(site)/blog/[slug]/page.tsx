import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/section";
import { getBlogPost, getBlogPosts } from "@/lib/api/content";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.coverImage ? { images: [post.coverImage] } : undefined,
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <Section background="ivory" containerClassName="py-10 sm:py-14">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-forest"
        >
          <ArrowLeft className="size-4" />
          All posts
        </Link>

        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-brand-700">
          {formatDate(post.publishedAt)}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-forest sm:text-4xl">
          {post.title}
        </h1>

        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-sage/50 px-3 py-1 text-xs font-medium text-forest"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {post.coverImage && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl border border-border/60">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="mt-8 space-y-4 text-base leading-relaxed text-charcoal/85">
          {post.content.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </article>
    </Section>
  );
}
