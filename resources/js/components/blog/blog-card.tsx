import { Link } from "@inertiajs/react";
import { BlogImage } from "@/components/blog/blog-image";
import { formatBlogDate, readingTime } from "@/lib/blog";
import { show as blogShow } from "@/routes/blog";
import type { BlogCardData } from "@/types/blog";

type BlogCardProps = {
    card: BlogCardData;
    /** First row of the grid: eager image. */
    priority?: boolean;
    /** Hide the excerpt (e.g. compact rails). */
    compact?: boolean;
};

/** Whole-card link with a single accessible name (the title). */
export function BlogCard({ card, priority = false, compact = false }: BlogCardProps) {
    return (
        <article className="h-full">
            <Link
                href={blogShow.url(card.slug)}
                className="focus-ring group flex h-full flex-col overflow-hidden rounded-panel border border-border bg-surface transition-colors duration-token hover:bg-surface-muted"
            >
                <div className="aspect-video w-full overflow-hidden bg-surface-muted">
                    {card.image && (
                        <BlogImage
                            image={card.image}
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            priority={priority}
                            className="size-full object-cover"
                        />
                    )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                    {card.category && (
                        <p className="text-caption font-bold text-primary-text">
                            {card.category.name}
                        </p>
                    )}
                    <h3 className="line-clamp-2 text-h3">{card.title}</h3>
                    {!compact && (
                        <p className="line-clamp-3 text-body text-muted-foreground max-sm:hidden">
                            {card.excerpt}
                        </p>
                    )}
                    <p className="mt-auto pt-1 text-caption text-subtle-foreground">
                        {card.published_at && (
                            <time dateTime={card.published_at}>
                                {formatBlogDate(card.published_at)}
                            </time>
                        )}
                        {card.published_at && " · "}
                        {readingTime(card.reading_minutes)}
                    </p>
                </div>
            </Link>
        </article>
    );
}

export function BlogCardGrid({ cards }: { cards: BlogCardData[] }) {
    return (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, i) => (
                <li key={card.id}>
                    <BlogCard card={card} priority={i < 4} />
                </li>
            ))}
        </ul>
    );
}
