import { Link } from "@inertiajs/react";
import { BlogAuthorAvatar } from "@/components/blog/blog-author-avatar";
import { formatBlogDate, readingTime } from "@/lib/blog";
import { show as blogAuthorShow } from "@/routes/blog/authors";
import type { BlogPostAuthor } from "@/types/blog";

type BlogAuthorBylineProps = {
    author: BlogPostAuthor;
    publishedAt: string | null;
    updatedAt: string | null;
    readingMinutes: number;
};

/** Byline under the title. The creator is never shown; the house author is a plain name with no link. */
export function BlogAuthorByline({
    author,
    publishedAt,
    updatedAt,
    readingMinutes,
}: BlogAuthorBylineProps) {
    const name = <span className="font-bold text-foreground">{author.name}</span>;

    return (
        <div className="mt-3 flex items-center gap-3">
            {!author.is_house && <BlogAuthorAvatar name={author.name} avatar={author.avatar} />}
            <p className="text-body-sm text-muted-foreground">
                <span className="sr-only">By </span>
                {author.has_profile && author.slug ? (
                    <Link
                        href={blogAuthorShow.url(author.slug)}
                        rel="author"
                        className="underline-offset-2 hover:text-primary-text hover:underline"
                    >
                        {name}
                    </Link>
                ) : (
                    name
                )}
                <br />
                {publishedAt && <time dateTime={publishedAt}>{formatBlogDate(publishedAt)}</time>}
                {updatedAt && (
                    <>
                        {" · Updated "}
                        <time dateTime={updatedAt}>{formatBlogDate(updatedAt)}</time>
                    </>
                )}
                {" · "}
                {readingTime(readingMinutes)}
            </p>
        </div>
    );
}
