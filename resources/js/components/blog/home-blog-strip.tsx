import { Link } from '@inertiajs/react';
import { BlogCard } from '@/components/blog/blog-card';
import { index as blogIndex } from '@/routes/blog';
import type { BlogCardData } from '@/types/blog';

/**
 * "From the blog" strip for the storefront home page. The server only sends posts while the blog
 * is enabled and at least three are live, so an empty list renders nothing.
 */
export function HomeBlogStrip({ posts }: { posts: BlogCardData[] }) {
    if (posts.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="home-blog-h" className="mt-6 md:mt-8">
            <div className="flex items-baseline justify-between gap-3">
                <h2 id="home-blog-h" className="text-h3">
                    From the blog
                </h2>
                <Link
                    href={blogIndex.url()}
                    className="inline-flex min-h-touch items-center text-label font-bold text-primary-text underline-offset-2 hover:underline"
                >
                    All stories
                </Link>
            </div>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                {posts.map((post) => (
                    <li key={post.id}>
                        <BlogCard card={post} compact />
                    </li>
                ))}
            </ul>
        </section>
    );
}
