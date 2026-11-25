import { Head, Link } from "@inertiajs/react";
import { Breadcrumb } from "@/components/breadcrumb";
import { BlogAuthorBox } from "@/components/blog/blog-author-box";
import { BlogAuthorByline } from "@/components/blog/blog-author-byline";
import { BlogBody } from "@/components/blog/blog-body";
import { BlogImage } from "@/components/blog/blog-image";
import { BlogRelated } from "@/components/blog/blog-related";
import { BlogToc } from "@/components/blog/blog-toc";
import { home } from "@/routes";
import { show as categoryShow } from "@/routes/categories";
import { index as blogIndex } from "@/routes/blog";
import { show as blogCategoryShow } from "@/routes/blog/categories";
import { show as blogTagShow } from "@/routes/blog/tags";
import type { BlogCardData, BlogImageData, BlogPostAuthor, BlogTocItem } from "@/types/blog";

type Props = {
    post: {
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        published_at: string | null;
        updated_at: string | null;
        reading_minutes: number;
        category: { name: string; slug: string };
        cover: BlogImageData | null;
        html: string;
        toc: BlogTocItem[];
        tags: { name: string; slug: string }[];
    };
    author: BlogPostAuthor;
    related: BlogCardData[];
    cta: { label: string; category_slug: string } | null;
};

export default function BlogShow({ post, author, related, cta }: Props) {
    const hasToc = post.toc.length > 0;

    return (
        <>
            <Head title={post.title} />
            <article className="pt-4 md:pt-6">
                <Breadcrumb
                    items={[
                        { label: "Home", href: home().url },
                        { label: "Blog", href: blogIndex.url() },
                        {
                            label: post.category.name,
                            href: blogCategoryShow.url(post.category.slug),
                        },
                        { label: post.title },
                    ]}
                />

                <header className="mx-auto mt-3 max-w-3xl" data-edge="start">
                    <Link
                        href={blogCategoryShow.url(post.category.slug)}
                        className="inline-flex min-h-touch items-center text-label font-bold text-primary-text underline-offset-2 hover:underline"
                    >
                        {post.category.name}
                    </Link>
                    <h1 className="text-h1">{post.title}</h1>
                    <p className="mt-2 text-body-lg text-muted-foreground">{post.excerpt}</p>
                    <BlogAuthorByline
                        author={author}
                        publishedAt={post.published_at}
                        updatedAt={post.updated_at}
                        readingMinutes={post.reading_minutes}
                    />
                </header>

                {post.cover && (
                    <figure className="mx-auto mt-5 max-w-4xl">
                        <BlogImage
                            image={post.cover}
                            sizes="(min-width: 896px) 896px, 100vw"
                            priority
                            className="h-auto w-full rounded-panel"
                        />
                    </figure>
                )}

                <div
                    className={
                        hasToc
                            ? "mx-auto mt-6 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]"
                            : "mx-auto mt-6 max-w-3xl"
                    }
                >
                    {hasToc && (
                        // Phones: collapsible, above the body. Desktop: sticky right column.
                        <div className="order-first lg:order-last">
                            <BlogToc items={post.toc} />
                        </div>
                    )}

                    <div className="min-w-0">
                        <BlogBody html={post.html} />

                        {post.tags.length > 0 && (
                            <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <li key={tag.slug}>
                                        <Link
                                            href={blogTagShow.url(tag.slug)}
                                            className="inline-flex min-h-9 items-center rounded-full border border-border-control bg-surface px-3 text-label text-foreground hover:bg-surface-muted"
                                        >
                                            {tag.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {cta && (
                            <aside
                                aria-label="Shop"
                                className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-primary-soft p-4"
                            >
                                <p className="text-h3 text-primary-soft-foreground">
                                    Ready to shop what you just read about?
                                </p>
                                <Link href={categoryShow.url(cta.category_slug)} className="btn">
                                    {cta.label}
                                </Link>
                            </aside>
                        )}

                        <BlogAuthorBox author={author} />
                    </div>
                </div>

                <div className="mx-auto max-w-5xl">
                    <BlogRelated posts={related} />
                </div>
            </article>
        </>
    );
}
