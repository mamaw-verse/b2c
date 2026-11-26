import { Head } from '@inertiajs/react';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { useState } from 'react';
import {
    AuthorContentFields,
    type AuthorLink,
} from '@/components/blog/author-fields';
import { ConfirmActionButton } from '@/components/blog/confirm-action-button';
import type { BlogImage } from '@/components/blog/image-upload-dialog';
import { FormModal } from '@/components/form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import {
    destroy as reactivateAuthor,
    store as deactivateAuthor,
} from '@/routes/admin/blog/authors/deactivation';
import { store as reassignAuthorPosts } from '@/routes/admin/blog/authors/reassignment';
import {
    store as storeAuthor,
    update as updateAuthor,
} from '@/routes/admin/blog/authors';

type Author = {
    id: string;
    user_id: string | null;
    display_name: string;
    slug: string;
    job_title: string | null;
    bio: string | null;
    links: AuthorLink[];
    is_house: boolean;
    is_active: boolean;
    consented: boolean;
    avatar: BlogImage | null;
    posts_count: number;
    user_email: string | null;
};
type LinkableUser = { id: string; name: string; email: string };

function Fields({
    author,
    users,
    consentText,
    errors,
}: {
    author?: Author;
    users: LinkableUser[];
    consentText: string;
    errors: Record<string, string>;
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label="Display name"
                    required
                    error={errors.display_name}
                >
                    <Input
                        name="display_name"
                        defaultValue={author?.display_name ?? ''}
                    />
                </FormField>
                <FormField
                    label="Slug"
                    optional
                    help={
                        author
                            ? 'Changing it changes the public author URL.'
                            : 'Generated from the name when empty.'
                    }
                    error={errors.slug}
                >
                    <Input name="slug" defaultValue={author?.slug ?? ''} />
                </FormField>
            </div>
            {!author?.is_house && (
                <FormField
                    label="Linked account"
                    optional
                    help="Only admins and editors can be linked."
                    error={errors.user_id}
                >
                    <Select name="user_id" defaultValue={author?.user_id ?? ''}>
                        <option value="">Guest author (no account)</option>
                        {author?.user_id && (
                            <option value={author.user_id}>
                                {author.user_email}
                            </option>
                        )}
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </Select>
                </FormField>
            )}
            <AuthorContentFields author={author} errors={errors} />
            {!author?.is_house &&
                (author?.consented ? (
                    <p className="text-body-sm text-muted-foreground">
                        Consent to be credited is on record.
                    </p>
                ) : (
                    <label className="flex items-start gap-2 text-body-sm">
                        <input
                            type="checkbox"
                            name="consent"
                            value="1"
                            className="mt-1 size-5"
                        />
                        <span>{consentText}</span>
                    </label>
                ))}
        </div>
    );
}

export default function BlogAuthors({
    authors,
    linkable_users,
    consent,
}: {
    authors: Author[];
    linkable_users: LinkableUser[];
    consent: { guest: string; version: string };
}) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Author | null>(null);
    const [reassigning, setReassigning] = useState<Author | null>(null);
    // Who may take over posts: the same rule as publishing (active, and consented or the house author).
    const creditable = authors.filter((a) => a.is_active && a.consented);

    return (
        <AdminLayout>
            <Head title="Blog authors" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Blog authors</h1>
                    <Button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="w-full md:w-auto"
                    >
                        New guest author
                    </Button>
                </div>
                <ul className="grid gap-2">
                    {authors.map((author) => (
                        <li
                            key={author.id}
                            className="panel flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                            {author.avatar ? (
                                <img
                                    src={author.avatar.preview_url}
                                    alt=""
                                    className="size-10 rounded-full object-cover"
                                />
                            ) : (
                                <span
                                    className="size-10 rounded-full bg-primary-soft"
                                    aria-hidden="true"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-label font-bold">
                                    {author.display_name}
                                </p>
                                <p className="truncate text-body-sm text-muted-foreground">
                                    {author.job_title ?? 'No job title'} ·{' '}
                                    {author.posts_count} posts
                                    {author.user_email
                                        ? ` · ${author.user_email}`
                                        : ''}
                                </p>
                            </div>
                            {author.is_house && (
                                <Badge variant="info">house</Badge>
                            )}
                            {!author.is_house && !author.consented && (
                                <Badge variant="warning">no consent yet</Badge>
                            )}
                            {!author.is_active && (
                                <Badge variant="neutral">deactivated</Badge>
                            )}
                            <IconButton
                                variant="plain"
                                icon={
                                    <Pencil
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                }
                                label={`Edit ${author.display_name}`}
                                onClick={() => setEditing(author)}
                            />
                            {author.posts_count > 0 && (
                                <IconButton
                                    variant="plain"
                                    icon={
                                        <ArrowRightLeft
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    }
                                    label={`Reassign ${author.display_name}'s posts`}
                                    onClick={() => setReassigning(author)}
                                />
                            )}
                            {!author.is_house &&
                                (author.is_active ? (
                                    <ConfirmActionButton
                                        label="Deactivate"
                                        method="post"
                                        url={
                                            deactivateAuthor({
                                                author: author.id,
                                            }).url
                                        }
                                        title="Deactivate author"
                                        text={`${author.display_name}'s profile page and author box are hidden. Existing posts stay credited to them.`}
                                    />
                                ) : (
                                    <ConfirmActionButton
                                        label="Reactivate"
                                        variant="neutral"
                                        url={
                                            reactivateAuthor({
                                                author: author.id,
                                            }).url
                                        }
                                        title="Reactivate author"
                                        text={`Show ${author.display_name}'s profile again?`}
                                    />
                                ))}
                        </li>
                    ))}
                </ul>
            </div>

            {creating && (
                <FormModal
                    title="New guest author"
                    action={storeAuthor().url}
                    method="post"
                    submitLabel="Create author"
                    onClose={() => setCreating(false)}
                >
                    {(errors) => (
                        <Fields
                            users={linkable_users}
                            consentText={consent.guest}
                            errors={errors}
                        />
                    )}
                </FormModal>
            )}
            {editing && (
                <FormModal
                    key={editing.id}
                    title={`Edit ${editing.display_name}`}
                    action={updateAuthor({ author: editing.id }).url}
                    method="put"
                    submitLabel="Save changes"
                    onClose={() => setEditing(null)}
                >
                    {(errors) => (
                        <Fields
                            author={editing}
                            users={linkable_users}
                            consentText={consent.guest}
                            errors={errors}
                        />
                    )}
                </FormModal>
            )}
            {reassigning && (
                <FormModal
                    key={reassigning.id}
                    title={`Reassign ${reassigning.display_name}'s posts`}
                    action={reassignAuthorPosts({ author: reassigning.id }).url}
                    method="post"
                    submitLabel="Reassign posts"
                    onClose={() => setReassigning(null)}
                >
                    {(errors) => (
                        <div className="grid gap-4">
                            <p className="text-body-sm text-muted-foreground">
                                Moves all {reassigning.posts_count}{' '}
                                {reassigning.posts_count === 1
                                    ? 'post'
                                    : 'posts'}{' '}
                                to the author you pick. The post dates are not
                                changed.
                            </p>
                            <FormField
                                label="New author"
                                required
                                error={errors.to_author_id}
                            >
                                <Select name="to_author_id" defaultValue="">
                                    <option value="" disabled>
                                        Choose an author
                                    </option>
                                    {creditable
                                        .filter((a) => a.id !== reassigning.id)
                                        .map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.display_name}
                                            </option>
                                        ))}
                                </Select>
                            </FormField>
                        </div>
                    )}
                </FormModal>
            )}
        </AdminLayout>
    );
}
