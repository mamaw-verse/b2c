import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/pagination';
import AdminLayout from '@/layouts/admin-layout';
import { create, edit, index } from '@/routes/admin/blog/posts';

type Post = {
    id: string;
    title: string;
    status: string;
    status_label: string;
    scheduled_for: string | null;
    published_at: string | null;
    category: string | null;
    author: string | null;
    created_by: string | null;
    views: number;
    is_featured: boolean;
};
type Option = { id: string; name: string };
type Filters = {
    status: string | null;
    category: string | null;
    author: string | null;
    q: string | null;
};

const when = (value: string | null) =>
    value ? new Date(value).toLocaleString() : '';

export default function BlogPosts({
    posts,
    filters,
    categories,
    authors,
    is_admin,
}: {
    posts: {
        data: Post[];
        meta: { current_page: number; last_page: number; total: number };
    };
    filters: Filters;
    categories: Option[];
    authors: Option[];
    is_admin: boolean;
}) {
    const [q, setQ] = useState(filters.q ?? '');

    const apply = (next: Partial<Filters>) => {
        const merged = { ...filters, q, ...next };
        router.get(
            index().url,
            Object.fromEntries(Object.entries(merged).filter(([, v]) => v)),
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout>
            <Head title="Blog posts" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Blog posts</h1>
                    <Button asChild className="w-full md:w-auto">
                        <Link href={create().url}>New post</Link>
                    </Button>
                </div>

                <form
                    className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply({});
                    }}
                >
                    <Input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search title or excerpt"
                        aria-label="Search posts"
                    />
                    <Select
                        aria-label="Status"
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            apply({ status: e.target.value || null })
                        }
                    >
                        <option value="">Any status</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </Select>
                    <Select
                        aria-label="Category"
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            apply({ category: e.target.value || null })
                        }
                    >
                        <option value="">Any category</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </Select>
                    <Select
                        aria-label="Author"
                        value={filters.author ?? ''}
                        onChange={(e) =>
                            apply({ author: e.target.value || null })
                        }
                    >
                        <option value="">Any author</option>
                        {authors.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </Select>
                    <Button type="submit" variant="neutral">
                        Filter
                    </Button>
                </form>

                {posts.data.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No posts match.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[56rem] text-left text-body-sm">
                            <thead className="text-muted-foreground">
                                <tr>
                                    <th className="py-2 pr-3">Title</th>
                                    <th className="pr-3">Author</th>
                                    {is_admin && (
                                        <th className="pr-3">Created by</th>
                                    )}
                                    <th className="pr-3">Category</th>
                                    <th className="pr-3">Status</th>
                                    <th className="pr-3">Published</th>
                                    <th className="pr-3">Views</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.data.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="border-t border-border"
                                    >
                                        <td className="py-2 pr-3">
                                            <Link
                                                href={
                                                    edit({ post: post.id }).url
                                                }
                                                className="font-bold text-primary-text"
                                            >
                                                {post.title}
                                            </Link>
                                            {post.is_featured && (
                                                <Badge
                                                    variant="info"
                                                    className="ml-2"
                                                >
                                                    featured
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="pr-3">{post.author}</td>
                                        {is_admin && (
                                            <td className="pr-3">
                                                {post.created_by}
                                            </td>
                                        )}
                                        <td className="pr-3">
                                            {post.category}
                                        </td>
                                        <td className="pr-3">
                                            {post.status_label}
                                            {post.scheduled_for &&
                                                ` for ${when(post.scheduled_for)}`}
                                        </td>
                                        <td className="pr-3">
                                            {when(post.published_at)}
                                        </td>
                                        <td className="pr-3">{post.views}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {posts.meta.last_page > 1 && (
                    <Pagination
                        page={posts.meta.current_page}
                        total={posts.meta.last_page}
                        href={(page) =>
                            `${index().url}?${new URLSearchParams({
                                ...Object.fromEntries(
                                    Object.entries(filters).filter(
                                        ([, v]) => v,
                                    ),
                                ),
                                page: String(page),
                            }).toString()}`
                        }
                    />
                )}
            </div>
        </AdminLayout>
    );
}
