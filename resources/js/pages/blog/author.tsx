import { Head, Link } from '@inertiajs/react';
import { Breadcrumb } from '@/components/breadcrumb';
import { BlogAuthorAvatar } from '@/components/blog/blog-author-avatar';
import { BlogCardGrid } from '@/components/blog/blog-card';
import { Pagination } from '@/components/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { home } from '@/routes';
import { index as blogIndex } from '@/routes/blog';
import { show as blogAuthorShow } from '@/routes/blog/authors';
import type {
    BlogAvatarData,
    BlogCardData,
    BlogLink,
    BlogPaged,
} from '@/types/blog';

type Props = {
    author: {
        name: string;
        slug: string;
        job_title: string | null;
        bio: string | null;
        avatar: BlogAvatarData | null;
        links: BlogLink[];
    };
    posts: BlogPaged<BlogCardData>;
};

export default function BlogAuthor({ author, posts }: Props) {
    const { current_page, last_page } = posts.meta;

    return (
        <>
            <Head title={author.name} />
            <div>
                <div className="pt-4 md:pt-6">
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: home().url },
                            { label: 'Blog', href: blogIndex.url() },
                            { label: author.name },
                        ]}
                    />
                    <div
                        className="mt-4 flex items-start gap-4"
                        data-edge="start"
                    >
                        <BlogAuthorAvatar
                            name={author.name}
                            avatar={author.avatar}
                            size="xl"
                        />
                        <div className="min-w-0">
                            <h1 className="text-h1">{author.name}</h1>
                            {author.job_title && (
                                <p className="text-body text-muted-foreground">
                                    {author.job_title}
                                </p>
                            )}
                            {author.bio && (
                                <p className="mt-2 max-w-prose text-body text-muted-foreground">
                                    {author.bio}
                                </p>
                            )}
                            {author.links.length > 0 && (
                                <ul className="mt-2 flex flex-wrap gap-x-4">
                                    {author.links.map((link) => (
                                        <li key={link.url}>
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow me"
                                                className="inline-flex min-h-touch items-center text-label font-bold text-primary-text underline-offset-2 hover:underline"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <section aria-labelledby="author-posts" className="mt-8">
                    <h2 id="author-posts" className="mb-3 text-h2">
                        Stories by {author.name}
                    </h2>
                    {posts.data.length > 0 ? (
                        <BlogCardGrid cards={posts.data} />
                    ) : (
                        <EmptyState
                            title="No published stories yet"
                            action={
                                <Link
                                    href={blogIndex.url()}
                                    className="btn btn-neutral"
                                >
                                    Browse the blog
                                </Link>
                            }
                        />
                    )}
                </section>

                {last_page > 1 && (
                    <div className="mt-6">
                        <Pagination
                            page={current_page}
                            total={last_page}
                            href={(page) =>
                                blogAuthorShow(author.slug, {
                                    query: page > 1 ? { page } : {},
                                }).url
                            }
                            label="Author pagination"
                        />
                    </div>
                )}
            </div>
        </>
    );
}
