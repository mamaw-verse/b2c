import { BlogCard } from '@/components/blog/blog-card';
import type { BlogCardData } from '@/types/blog';

export function BlogRelated({ posts }: { posts: BlogCardData[] }) {
    if (posts.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="blog-related" className="mt-10">
            <h2 id="blog-related" className="mb-3 text-h2">
                Related stories
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                    <li key={post.id}>
                        <BlogCard card={post} compact />
                    </li>
                ))}
            </ul>
        </section>
    );
}
