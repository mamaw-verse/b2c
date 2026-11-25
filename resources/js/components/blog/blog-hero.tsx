import { Link } from "@inertiajs/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { BlogImage } from "@/components/blog/blog-image";
import { show as blogShow } from "@/routes/blog";
import type { BlogCardData } from "@/types/blog";

/**
 * Featured stories as a scroll-snap strip (no autoplay, so reduced-motion needs nothing special; the
 * arrow buttons only appear for pointer users). `carousel.tsx` is a product-photo zoom gallery and
 * does not fit text slides.
 */
export function BlogHero({ posts }: { posts: BlogCardData[] }) {
    const track = useRef<HTMLUListElement>(null);

    if (posts.length === 0) {
        return null;
    }

    const scroll = (direction: -1 | 1) => {
        const el = track.current;
        if (!el) {
            return;
        }
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollBy({
            left: direction * el.clientWidth,
            behavior: reduce ? "auto" : "smooth",
        });
    };

    return (
        <section aria-labelledby="blog-featured" className="relative mt-4">
            <h2 id="blog-featured" className="sr-only">
                Featured stories
            </h2>
            <ul
                ref={track}
                className="flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto"
            >
                {posts.map((post, i) => (
                    <li
                        key={post.id}
                        className="w-full shrink-0 snap-start md:w-[calc(50%-0.375rem)]"
                    >
                        <Link
                            href={blogShow.url(post.slug)}
                            className="focus-ring group relative block overflow-hidden rounded-panel bg-surface-muted"
                        >
                            {post.image && (
                                <BlogImage
                                    image={post.image}
                                    sizes="(min-width: 768px) 50vw, 100vw"
                                    priority={i === 0}
                                    className="aspect-video w-full object-cover"
                                />
                            )}
                            <span className="block p-3">
                                {post.category && (
                                    <span className="block text-caption font-bold text-primary-text">
                                        {post.category.name}
                                    </span>
                                )}
                                <span className="mt-1 line-clamp-2 block text-h2">
                                    {post.title}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-body text-muted-foreground max-md:hidden">
                                    {post.excerpt}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
            {posts.length > 1 && (
                <div className="absolute top-1/3 right-2 left-2 hidden justify-between md:flex">
                    <button
                        type="button"
                        className="btn btn-neutral btn-icon"
                        aria-label="Previous featured story"
                        onClick={() => scroll(-1)}
                    >
                        <ChevronLeft aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="btn btn-neutral btn-icon"
                        aria-label="Next featured story"
                        onClick={() => scroll(1)}
                    >
                        <ChevronRight aria-hidden="true" />
                    </button>
                </div>
            )}
        </section>
    );
}
