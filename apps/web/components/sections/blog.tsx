import { Section, SectionHeader } from "@/components/section";
import { MediaCard, CardCta } from "@/components/cards";
import { getBlogPosts } from "@/lib/api/content";

export async function Blog() {
  const posts = (await getBlogPosts()).slice(0, 3);
  // Nothing published yet — don't render an empty section on the home page.
  if (posts.length === 0) return null;

  return (
    <Section id="blog" background="cream">
      <SectionHeader
        eyebrow="From the Journal"
        title="Wisdom for Everyday Life"
        description="Insights, tips, and timeless wisdom for a more mindful and balanced life."
        actionHref="/blog"
        actionLabel="View All Blogs"
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <MediaCard
            key={post.id}
            href={`/blog/${post.slug}`}
            image={post.coverImage}
            alt={post.title}
            ariaLabel={post.title}
            aspect="video"
            sizes="(max-width: 768px) 100vw, 33vw"
          >
            <h3 className="font-display text-lg font-semibold text-forest">
              {post.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <span className="mt-4">
              <CardCta label="Read More" />
            </span>
          </MediaCard>
        ))}
      </div>
    </Section>
  );
}
