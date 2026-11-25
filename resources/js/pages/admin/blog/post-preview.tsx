import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { edit } from '@/routes/admin/blog/posts';

type Preview = {
    id: string;
    title: string;
    excerpt: string;
    category: string | null;
    author: string | null;
    author_title: string | null;
    status: string;
    published_at: string | null;
    reading_minutes: number;
    cover_url: string | null;
    cover_alt: string | null;
    html: string;
    toc: { id: string; text: string; level: number }[];
};

/** Admin preview of a post in any status. The public page (Phase 2) reuses the same stored HTML. */
export default function BlogPostPreview({ post }: { post: Preview }) {
    return (
        <AdminLayout>
            <Head title={`Preview: ${post.title}`}>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <article className="mx-auto grid max-w-prose gap-4 p-gutter py-8">
                <p className="text-body-sm text-muted-foreground">
                    Preview ({post.status}) ·{' '}
                    <Link
                        href={edit({ post: post.id }).url}
                        className="font-bold text-primary-text"
                    >
                        Back to editing
                    </Link>
                </p>
                {post.category && (
                    <p className="text-eyebrow uppercase">{post.category}</p>
                )}
                <h1 className="text-h1">{post.title}</h1>
                <p className="text-body text-muted-foreground">
                    {post.excerpt}
                </p>
                <p className="text-body-sm text-muted-foreground">
                    {post.author}
                    {post.author_title ? `, ${post.author_title}` : ''} ·{' '}
                    {post.reading_minutes} min read
                </p>
                {post.cover_url && (
                    <img
                        src={post.cover_url}
                        alt={post.cover_alt ?? ''}
                        className="w-full rounded-card"
                    />
                )}
                {post.toc.length >= 3 && (
                    <nav aria-label="Table of contents" className="panel p-4">
                        <ul className="grid gap-1 text-body-sm">
                            {post.toc.map((entry) => (
                                <li
                                    key={entry.id}
                                    className={entry.level === 3 ? 'pl-4' : ''}
                                >
                                    <a href={`#${entry.id}`}>{entry.text}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
                {/* Safe: html comes from RenderBlogBody, which strips raw HTML and unsafe links. */}
                <div
                    className="grid gap-4 [&_a]:text-primary-text [&_a]:underline [&_figure]:grid [&_figure]:gap-1 [&_h2]:text-h2 [&_h3]:text-h3 [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                />
            </article>
        </AdminLayout>
    );
}
