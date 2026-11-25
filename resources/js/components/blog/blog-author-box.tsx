import { Link } from '@inertiajs/react';
import { BlogAuthorAvatar } from '@/components/blog/blog-author-avatar';
import { show as blogAuthorShow } from '@/routes/blog/authors';
import type { BlogPostAuthor } from '@/types/blog';

/** End-of-post author box. Omitted for the house author and for deactivated profiles. */
export function BlogAuthorBox({ author }: { author: BlogPostAuthor }) {
    if (author.is_house || !author.has_profile || !author.slug) {
        return null;
    }

    return (
        <aside
            aria-label="About the author"
            className="mt-8 flex gap-3 rounded-panel border border-border bg-surface p-4"
        >
            <BlogAuthorAvatar
                name={author.name}
                avatar={author.avatar}
                size="lg"
            />
            <div className="min-w-0">
                <p className="text-h3">{author.name}</p>
                {author.job_title && (
                    <p className="text-body-sm text-muted-foreground">
                        {author.job_title}
                    </p>
                )}
                {author.bio && (
                    <p className="mt-2 text-body text-muted-foreground">
                        {author.bio}
                    </p>
                )}
                <Link
                    href={blogAuthorShow.url(author.slug)}
                    className="mt-2 inline-flex min-h-touch items-center text-label font-bold text-primary-text underline-offset-2 hover:underline"
                >
                    More from {author.name}
                </Link>
            </div>
        </aside>
    );
}
