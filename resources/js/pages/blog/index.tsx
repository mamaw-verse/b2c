import { Head, Link, router } from "@inertiajs/react";
import { Breadcrumb } from "@/components/breadcrumb";
import { BlogCardGrid, BlogCard } from "@/components/blog/blog-card";
import { BlogCategoryChips } from "@/components/blog/blog-category-chips";
import { BlogHero } from "@/components/blog/blog-hero";
import { Pagination } from "@/components/pagination";
import { SearchInput } from "@/components/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { home } from "@/routes";
import { index as blogIndex } from "@/routes/blog";
import { show as blogCategoryShow } from "@/routes/blog/categories";
import { show as blogTagShow } from "@/routes/blog/tags";
import type { BlogCardData, BlogCategoryChip, BlogPaged } from "@/types/blog";

type Props = {
    /** One page component serves the index, a category and a tag. */
    mode: "index" | "category" | "tag";
    heading: string;
    intro: string | null;
    slug: string | null;
    q: string | null;
    active_category: string | null;
    categories: BlogCategoryChip[];
    hero: BlogCardData[];
    popular: BlogCardData[];
    posts: BlogPaged<BlogCardData>;
    total_live: number;
};

export default function BlogIndex({
    mode,
    heading,
    intro,
    slug,
    q,
    active_category,
    categories,
    hero,
    popular,
    posts,
    total_live,
}: Props) {
    const { current_page, last_page } = posts.meta;

    const pageHref = (page: number) => {
        const query = {
            ...(q ? { q } : {}),
            ...(page > 1 ? { page } : {}),
        };

        if (mode === "category" && slug) {
            return blogCategoryShow(slug, { query }).url;
        }
        if (mode === "tag" && slug) {
            return blogTagShow(slug, { query }).url;
        }

        return blogIndex({ query }).url;
    };

    const crumbs =
        mode === "index"
            ? []
            : [
                  { label: "Home", href: home().url },
                  { label: "Blog", href: blogIndex.url() },
                  { label: heading },
              ];

    const sectionTitle = q ? `Results for “${q}”` : mode === "index" ? "Latest stories" : "Stories";

    return (
        <>
            <Head title={heading} />
            <div>
                <div className="pt-4 md:pt-6">
                    {crumbs.length > 0 && <Breadcrumb items={crumbs} />}
                    <h1 className="mt-2 text-h1" data-edge="start">
                        {mode === "tag" ? `Stories tagged ${heading}` : heading}
                    </h1>
                    {intro && (
                        <p className="mt-2 max-w-prose text-body text-muted-foreground">{intro}</p>
                    )}
                </div>

                {mode === "index" && (
                    <SearchInput
                        id="blog-search"
                        value={q ?? ""}
                        label="Search the blog"
                        placeholder="Search the blog"
                        className="mt-4"
                        onSearch={(term) => router.get(blogIndex.url(), term ? { q: term } : {})}
                    />
                )}

                {mode !== "tag" && (
                    <BlogCategoryChips categories={categories} active={active_category} />
                )}

                <BlogHero posts={hero} />

                <section aria-labelledby="blog-latest" className="mt-6">
                    <h2 id="blog-latest" className={mode === "index" ? "mb-3 text-h2" : "sr-only"}>
                        {sectionTitle}
                    </h2>
                    {posts.data.length > 0 ? (
                        <BlogCardGrid cards={posts.data} />
                    ) : q ? (
                        <EmptyState
                            title={`No stories match “${q}”`}
                            text="Try a different word, or browse everything we have published."
                            action={
                                <Link href={blogIndex.url()} className="btn btn-neutral">
                                    See all stories
                                </Link>
                            }
                        />
                    ) : mode === "index" && total_live === 0 ? (
                        <EmptyState
                            title="No stories yet"
                            text="We’re getting our first stories ready. In the meantime, the shop is open."
                            action={
                                <Link href={home().url} className="btn">
                                    Shop halal products
                                </Link>
                            }
                        />
                    ) : (
                        <EmptyState
                            title="No stories here yet"
                            action={
                                <Link href={blogIndex.url()} className="btn btn-neutral">
                                    See all stories
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
                            href={pageHref}
                            label="Blog pagination"
                        />
                    </div>
                )}

                {popular.length > 0 && (
                    <section aria-labelledby="blog-popular" className="mt-10">
                        <h2 id="blog-popular" className="mb-3 text-h2">
                            Popular stories
                        </h2>
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {popular.map((post) => (
                                <li key={post.id}>
                                    <BlogCard card={post} compact />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </>
    );
}
