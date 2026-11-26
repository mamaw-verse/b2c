import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ConfirmActionButton } from '@/components/blog/confirm-action-button';
import {
    ImageUploadDialog,
    type BlogImage,
} from '@/components/blog/image-upload-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TextArea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { getCsrfHeaders } from '@/lib/csrf';
import { store as previewMarkdown } from '@/routes/admin/blog/markdown-preview';
import {
    destroy as destroyPost,
    index,
    preview,
    store as storePost,
    update as updatePost,
} from '@/routes/admin/blog/posts';
import {
    destroy as restorePost,
    store as archivePost,
} from '@/routes/admin/blog/posts/archive';
import { update as featurePost } from '@/routes/admin/blog/posts/featured';
import {
    destroy as unpublishPost,
    store as publishPost,
} from '@/routes/admin/blog/posts/publication';
import { edit as editProfile } from '@/routes/admin/blog/profile';

type Faq = { question: string; answer: string };
type Post = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    body_markdown: string;
    blog_category_id: string;
    blog_author_id: string;
    cover: BlogImage | null;
    thumbnail: BlogImage | null;
    tags: string[];
    faqs: Faq[];
    seo_title: string | null;
    seo_description: string | null;
    status: 'draft' | 'published' | 'archived';
    published_at: string | null;
    is_scheduled: boolean;
    is_live: boolean;
    is_featured: boolean;
    word_count: number;
    reading_minutes: number;
};
type Author = {
    id: string;
    display_name: string;
    is_house: boolean;
    consented: boolean;
    is_active: boolean;
};
type Props = {
    post: Post | null;
    categories: { id: string; name: string }[];
    authors: Author[];
    default_author_id: string | null;
    can: {
        feature: boolean;
        change_author: boolean;
        delete: boolean;
        create_own_profile: boolean;
    };
    publish_check: {
        errors: string[];
        warnings: string[];
        can_publish: boolean;
    } | null;
    limits: {
        cover_min: string;
        excerpt_min: number;
        excerpt_max: number;
        min_words: number;
        faq_max: number;
        faq_question_max: number;
        faq_answer_max: number;
    };
};

type Preview = {
    html: string;
    word_count: number;
    reading_minutes: number;
    errors: string[];
    warnings: string[];
};
type Upload = 'cover' | 'thumbnail' | 'body' | null;

function ImageSlot({
    label,
    image,
    help,
    error,
    onPick,
    onClear,
}: {
    label: string;
    image: BlogImage | null;
    help: string;
    error?: string;
    onPick: () => void;
    onClear: () => void;
}) {
    return (
        <div className="grid gap-1">
            <p className="text-label font-bold">{label}</p>
            <div className="flex items-center gap-3">
                {image && (
                    <img
                        src={image.preview_url}
                        alt={image.alt ?? ''}
                        className="h-14 w-24 rounded-card object-cover"
                    />
                )}
                <Button type="button" variant="neutral" onClick={onPick}>
                    {image ? 'Replace' : 'Upload'}
                </Button>
                {image && (
                    <Button type="button" variant="plain" onClick={onClear}>
                        Remove
                    </Button>
                )}
            </div>
            <p className="text-body-sm text-muted-foreground">{help}</p>
            {error && (
                <p className="text-body-sm font-bold text-danger-text">
                    {error}
                </p>
            )}
        </div>
    );
}

export default function BlogPostForm({
    post,
    categories,
    authors,
    default_author_id,
    can,
    publish_check,
    limits,
}: Props) {
    const form = useForm({
        title: post?.title ?? '',
        slug: post?.slug ?? '',
        excerpt: post?.excerpt ?? '',
        body_markdown: post?.body_markdown ?? '',
        blog_category_id: post?.blog_category_id ?? categories[0]?.id ?? '',
        blog_author_id: post?.blog_author_id ?? default_author_id ?? '',
        cover_image_id: post?.cover?.id ?? '',
        thumbnail_image_id: post?.thumbnail?.id ?? '',
        tags: (post?.tags ?? []).join(', '),
        faqs: (post?.faqs ?? []) as Faq[],
        seo_title: post?.seo_title ?? '',
        seo_description: post?.seo_description ?? '',
    });
    const [cover, setCover] = useState<BlogImage | null>(post?.cover ?? null);
    const [thumbnail, setThumbnail] = useState<BlogImage | null>(
        post?.thumbnail ?? null,
    );
    const [upload, setUpload] = useState<Upload>(null);
    const [publishAt, setPublishAt] = useState('');
    const [rendered, setRendered] = useState<Preview | null>(null);
    const bodyRef = useRef<HTMLTextAreaElement>(null);

    // Live preview through the same renderer the save path uses.
    useEffect(() => {
        const handle = setTimeout(async () => {
            try {
                const response = await fetch(previewMarkdown().url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        ...getCsrfHeaders(),
                    },
                    body: JSON.stringify({ markdown: form.data.body_markdown }),
                    credentials: 'same-origin',
                });
                if (response.ok) {
                    setRendered((await response.json()) as Preview);
                }
            } catch {
                /* the preview is a convenience; saving still works */
            }
        }, 500);
        return () => clearTimeout(handle);
    }, [form.data.body_markdown]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            tags: data.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            // Untouched blank rows are dropped here; the server also ignores them.
            faqs: data.faqs.filter(
                (faq) => faq.question.trim() !== '' || faq.answer.trim() !== '',
            ),
        }));
        if (post) {
            form.put(updatePost({ post: post.id }).url, {
                preserveScroll: true,
            });
        } else {
            form.post(storePost().url);
        }
    };

    const insertImage = (image: BlogImage) => {
        const el = bodyRef.current;
        const at = el?.selectionStart ?? form.data.body_markdown.length;
        const text = form.data.body_markdown;
        form.setData(
            'body_markdown',
            `${text.slice(0, at)}\n\n${image.markdown}\n\n${text.slice(at)}`,
        );
    };

    const errorList = Object.entries(form.errors).filter(
        ([key]) => key === 'publish' || key.startsWith('publish'),
    );

    return (
        <AdminLayout>
            <Head title={post ? `Edit: ${post.title}` : 'New post'} />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={index().url}
                        className="text-body-sm font-bold text-primary-text"
                    >
                        ← All posts
                    </Link>
                    <h1 className="text-h1">
                        {post ? 'Edit post' : 'New post'}
                    </h1>
                    {post && (
                        <Badge variant={post.is_live ? 'success' : 'neutral'}>
                            {post.is_scheduled
                                ? 'scheduled'
                                : post.is_live
                                  ? 'published'
                                  : post.status}
                        </Badge>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <form onSubmit={submit} className="grid gap-4">
                        <FormField
                            label="Title"
                            required
                            error={form.errors.title}
                        >
                            <Input
                                value={form.data.title}
                                maxLength={160}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                            />
                        </FormField>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label="Slug"
                                optional
                                help="Generated from the title when empty. Old URLs redirect after a change."
                                error={form.errors.slug}
                            >
                                <Input
                                    value={form.data.slug}
                                    onChange={(e) =>
                                        form.setData('slug', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                label="Category"
                                required
                                error={form.errors.blog_category_id}
                            >
                                <Select
                                    value={form.data.blog_category_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'blog_category_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </Select>
                            </FormField>
                        </div>
                        <FormField
                            label="Author (write on behalf of)"
                            required
                            help={
                                can.change_author
                                    ? 'The public byline. You stay recorded as the creator internally.'
                                    : 'Only an admin can change the author after publishing.'
                            }
                            error={form.errors.blog_author_id}
                        >
                            <Select
                                value={form.data.blog_author_id}
                                disabled={!can.change_author}
                                onChange={(e) =>
                                    form.setData(
                                        'blog_author_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="" disabled>
                                    Choose an author
                                </option>
                                {authors.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.display_name}
                                        {a.is_house ? ' (house)' : ''}
                                        {!a.is_house && !a.consented
                                            ? ' — no consent yet'
                                            : ''}
                                        {!a.is_active ? ' — deactivated' : ''}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                        {can.create_own_profile && (
                            <p className="text-body-sm text-muted-foreground">
                                Want to write under your own name?{' '}
                                <Link
                                    href={editProfile().url}
                                    className="font-bold text-primary-text"
                                >
                                    Create my author profile
                                </Link>
                                .
                            </p>
                        )}
                        <FormField
                            label="Excerpt"
                            help={`${limits.excerpt_min} to ${limits.excerpt_max} characters. Shown under the title and as the meta description.`}
                            counter={`${form.data.excerpt.length}/${limits.excerpt_max}`}
                            error={form.errors.excerpt}
                        >
                            <TextArea
                                rows={3}
                                maxLength={limits.excerpt_max}
                                value={form.data.excerpt}
                                onChange={(e) =>
                                    form.setData('excerpt', e.target.value)
                                }
                            />
                        </FormField>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <ImageSlot
                                label="Cover image"
                                image={cover}
                                help={`Required to publish, at least ${limits.cover_min}, with alt text.`}
                                error={form.errors.cover_image_id}
                                onPick={() => setUpload('cover')}
                                onClear={() => {
                                    setCover(null);
                                    form.setData('cover_image_id', '');
                                }}
                            />
                            <ImageSlot
                                label="Thumbnail"
                                image={thumbnail}
                                help="Optional. Cards use the cover when empty."
                                error={form.errors.thumbnail_image_id}
                                onPick={() => setUpload('thumbnail')}
                                onClear={() => {
                                    setThumbnail(null);
                                    form.setData('thumbnail_image_id', '');
                                }}
                            />
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="body"
                                    className="text-label font-bold"
                                >
                                    Body (Markdown)
                                </label>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="sm"
                                    onClick={() => setUpload('body')}
                                >
                                    Insert image
                                </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <TextArea
                                    id="body"
                                    ref={bodyRef}
                                    rows={22}
                                    className="font-mono"
                                    value={form.data.body_markdown}
                                    onChange={(e) =>
                                        form.setData(
                                            'body_markdown',
                                            e.target.value,
                                        )
                                    }
                                />
                                <div
                                    className="panel max-h-[34rem] overflow-y-auto p-3"
                                    aria-label="Preview"
                                >
                                    {/* Safe: rendered by the server-side RenderBlogBody (raw HTML stripped). */}
                                    <div
                                        className="grid gap-3 text-body-sm [&_a]:underline [&_h2]:text-h3 [&_h3]:text-h4 [&_img]:h-auto [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                                        dangerouslySetInnerHTML={{
                                            __html: rendered?.html ?? '',
                                        }}
                                    />
                                </div>
                            </div>
                            <p className="text-body-sm text-muted-foreground">
                                {rendered
                                    ? `${rendered.word_count} words · ${rendered.reading_minutes} min read`
                                    : ''}{' '}
                                Put <code>[[product:slug]]</code> on its own
                                line to embed a product card.
                            </p>
                            {form.errors.body_markdown && (
                                <p className="text-body-sm font-bold text-danger-text">
                                    {form.errors.body_markdown}
                                </p>
                            )}
                        </div>

                        <section
                            aria-labelledby="faq-editor-heading"
                            className="panel grid gap-3 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 id="faq-editor-heading" className="text-h4">
                                    FAQ (optional)
                                </h2>
                                <Button
                                    type="button"
                                    variant="neutral"
                                    size="sm"
                                    disabled={
                                        form.data.faqs.length >= limits.faq_max
                                    }
                                    onClick={() =>
                                        form.setData('faqs', [
                                            ...form.data.faqs,
                                            { question: '', answer: '' },
                                        ])
                                    }
                                >
                                    Add question
                                </Button>
                            </div>
                            <p className="text-body-sm text-muted-foreground">
                                Shown under the article and published as FAQ
                                markup, so write only questions readers can see
                                answered here. Plain text, up to{' '}
                                {limits.faq_max} entries.
                            </p>
                            {form.data.faqs.map((faq, index) => {
                                const errors = form.errors as Record<
                                    string,
                                    string | undefined
                                >;
                                return (
                                    <div
                                        key={index}
                                        className="grid gap-2 rounded-card border border-border-control p-3"
                                    >
                                        <FormField
                                            label={`Question ${index + 1}`}
                                            counter={`${faq.question.length}/${limits.faq_question_max}`}
                                            error={
                                                errors[`faqs.${index}.question`]
                                            }
                                        >
                                            <Input
                                                value={faq.question}
                                                maxLength={
                                                    limits.faq_question_max
                                                }
                                                onChange={(e) =>
                                                    form.setData(
                                                        'faqs',
                                                        form.data.faqs.map(
                                                            (item, at) =>
                                                                at === index
                                                                    ? {
                                                                          ...item,
                                                                          question:
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                            />
                                        </FormField>
                                        <FormField
                                            label={`Answer ${index + 1}`}
                                            counter={`${faq.answer.length}/${limits.faq_answer_max}`}
                                            error={
                                                errors[`faqs.${index}.answer`]
                                            }
                                        >
                                            <TextArea
                                                rows={3}
                                                value={faq.answer}
                                                maxLength={
                                                    limits.faq_answer_max
                                                }
                                                onChange={(e) =>
                                                    form.setData(
                                                        'faqs',
                                                        form.data.faqs.map(
                                                            (item, at) =>
                                                                at === index
                                                                    ? {
                                                                          ...item,
                                                                          answer: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                            />
                                        </FormField>
                                        <div>
                                            <Button
                                                type="button"
                                                variant="plain"
                                                size="sm"
                                                onClick={() =>
                                                    form.setData(
                                                        'faqs',
                                                        form.data.faqs.filter(
                                                            (_, at) =>
                                                                at !== index,
                                                        ),
                                                    )
                                                }
                                            >
                                                Remove question {index + 1}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                            {form.errors.faqs && (
                                <p className="text-body-sm font-bold text-danger-text">
                                    {form.errors.faqs}
                                </p>
                            )}
                        </section>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label="Tags"
                                optional
                                help="Comma-separated, up to 10."
                                error={form.errors.tags}
                            >
                                <Input
                                    value={form.data.tags}
                                    onChange={(e) =>
                                        form.setData('tags', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                label="SEO title"
                                optional
                                counter={`${form.data.seo_title.length}/70`}
                                error={form.errors.seo_title}
                            >
                                <Input
                                    value={form.data.seo_title}
                                    maxLength={70}
                                    onChange={(e) =>
                                        form.setData(
                                            'seo_title',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                label="SEO description"
                                optional
                                counter={`${form.data.seo_description.length}/170`}
                                error={form.errors.seo_description}
                                className="sm:col-span-2"
                            >
                                <TextArea
                                    rows={2}
                                    maxLength={170}
                                    value={form.data.seo_description}
                                    onChange={(e) =>
                                        form.setData(
                                            'seo_description',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" loading={form.processing}>
                                {post ? 'Save changes' : 'Save draft'}
                            </Button>
                        </div>
                    </form>

                    <aside className="grid content-start gap-4">
                        {post && (
                            <section className="panel grid gap-3 p-4">
                                <h2 className="text-h4">Publish</h2>
                                {publish_check && (
                                    <>
                                        {publish_check.errors.length > 0 ? (
                                            <ul
                                                className="grid gap-1 text-body-sm text-danger-text"
                                                aria-label="Blocking checks"
                                            >
                                                {publish_check.errors.map(
                                                    (m) => (
                                                        <li key={m}>✗ {m}</li>
                                                    ),
                                                )}
                                            </ul>
                                        ) : (
                                            <p className="text-body-sm font-bold text-success">
                                                ✓ Ready to publish
                                            </p>
                                        )}
                                        {publish_check.warnings.length > 0 && (
                                            <ul
                                                className="grid gap-1 text-body-sm text-muted-foreground"
                                                aria-label="Warnings"
                                            >
                                                {publish_check.warnings.map(
                                                    (m) => (
                                                        <li key={m}>! {m}</li>
                                                    ),
                                                )}
                                            </ul>
                                        )}
                                        <p className="text-caption text-muted-foreground">
                                            Checks reflect the last saved
                                            version.
                                        </p>
                                    </>
                                )}
                                {errorList.map(([key, message]) => (
                                    <p
                                        key={key}
                                        role="alert"
                                        className="text-body-sm font-bold text-danger-text"
                                    >
                                        {message}
                                    </p>
                                ))}
                                {post.status !== 'archived' && (
                                    <>
                                        <FormField
                                            label="Publish at"
                                            optional
                                            help="Leave empty to publish now. A future time schedules the post."
                                        >
                                            <Input
                                                type="datetime-local"
                                                value={publishAt}
                                                onChange={(e) =>
                                                    setPublishAt(e.target.value)
                                                }
                                            />
                                        </FormField>
                                        <Button
                                            type="button"
                                            disabled={
                                                !publish_check?.can_publish
                                            }
                                            onClick={() =>
                                                router.post(
                                                    publishPost({
                                                        post: post.id,
                                                    }).url,
                                                    publishAt
                                                        ? {
                                                              published_at:
                                                                  publishAt,
                                                          }
                                                        : {},
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            {post.status === 'published'
                                                ? 'Update publish time'
                                                : publishAt
                                                  ? 'Schedule'
                                                  : 'Publish'}
                                        </Button>
                                    </>
                                )}
                                {post.status === 'published' && (
                                    <ConfirmActionButton
                                        label="Unpublish"
                                        url={
                                            unpublishPost({ post: post.id }).url
                                        }
                                        title="Unpublish post"
                                        text="The post goes back to draft and disappears from the blog."
                                    />
                                )}
                                {post.status === 'archived' ? (
                                    <ConfirmActionButton
                                        label="Restore as draft"
                                        variant="neutral"
                                        url={restorePost({ post: post.id }).url}
                                        title="Restore post"
                                        text="The post returns as a draft and must be published again."
                                    />
                                ) : (
                                    <ConfirmActionButton
                                        label="Archive"
                                        method="post"
                                        url={archivePost({ post: post.id }).url}
                                        title="Archive post"
                                        text="Archived posts are not shown publicly and their old URL stops working."
                                    />
                                )}
                                <Button asChild variant="neutral">
                                    <Link href={preview({ post: post.id }).url}>
                                        Preview
                                    </Link>
                                </Button>
                                {can.feature && (
                                    <Switch
                                        id="featured"
                                        label="Featured on the blog hero"
                                        checked={post.is_featured}
                                        onChange={(e) =>
                                            router.put(
                                                featurePost({ post: post.id })
                                                    .url,
                                                {
                                                    is_featured:
                                                        e.target.checked,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    />
                                )}
                                {can.delete && (
                                    <ConfirmActionButton
                                        label="Delete"
                                        url={destroyPost({ post: post.id }).url}
                                        title="Delete post"
                                        text="Delete this post? It can only be restored by a developer."
                                    />
                                )}
                            </section>
                        )}
                        {!post && (
                            <p className="panel p-4 text-body-sm text-muted-foreground">
                                Save the draft first. Publishing, scheduling and
                                the checklist appear after the first save.
                            </p>
                        )}
                    </aside>
                </div>
            </div>

            {upload && (
                <ImageUploadDialog
                    purpose={upload}
                    title={
                        upload === 'cover'
                            ? 'Upload cover image'
                            : upload === 'thumbnail'
                              ? 'Upload thumbnail'
                              : 'Insert image'
                    }
                    onClose={() => setUpload(null)}
                    onUploaded={(image) => {
                        if (upload === 'cover') {
                            setCover(image);
                            form.setData('cover_image_id', image.id);
                        } else if (upload === 'thumbnail') {
                            setThumbnail(image);
                            form.setData('thumbnail_image_id', image.id);
                        } else {
                            insertImage(image);
                        }
                    }}
                />
            )}
        </AdminLayout>
    );
}
