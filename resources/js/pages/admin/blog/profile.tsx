import { Form, Head } from '@inertiajs/react';
import {
    AuthorContentFields,
    type AuthorLink,
} from '@/components/blog/author-fields';
import type { BlogImage } from '@/components/blog/image-upload-dialog';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import {
    store as createProfile,
    update as updateProfile,
} from '@/routes/admin/blog/profile';

type Author = {
    display_name: string;
    slug: string;
    job_title: string | null;
    bio: string | null;
    links: AuthorLink[];
    avatar: BlogImage | null;
};

export default function BlogProfile({
    author,
    consent,
}: {
    author: Author | null;
    consent: { self: string; version: string };
}) {
    return (
        <AdminLayout>
            <Head title="My author profile" />
            <div className="mx-auto grid max-w-prose gap-4 p-gutter py-8">
                <h1 className="text-h1">My author profile</h1>

                {author === null ? (
                    <Form
                        action={createProfile().url}
                        method="post"
                        className="panel grid gap-4 p-4 md:p-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <p className="text-body">
                                    You do not have an author profile yet.
                                    Create one to write under your own name.
                                </p>
                                <label className="flex items-start gap-2 text-body-sm">
                                    <input
                                        type="checkbox"
                                        name="consent"
                                        value="1"
                                        className="mt-1 size-5"
                                    />
                                    <span>{consent.self}</span>
                                </label>
                                {errors.consent && (
                                    <p
                                        role="alert"
                                        className="font-bold text-danger-text"
                                    >
                                        {errors.consent}
                                    </p>
                                )}
                                <Button type="submit" loading={processing}>
                                    Create my author profile
                                </Button>
                            </>
                        )}
                    </Form>
                ) : (
                    <Form
                        action={updateProfile().url}
                        method="put"
                        className="panel grid gap-4 p-4 md:p-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <p className="text-body-sm text-muted-foreground">
                                    Shown as{' '}
                                    <strong>{author.display_name}</strong> on
                                    your posts and author page (/blog/author/
                                    {author.slug}).
                                </p>
                                <AuthorContentFields
                                    author={author}
                                    errors={errors}
                                />
                                <Button type="submit" loading={processing}>
                                    Save profile
                                </Button>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </AdminLayout>
    );
}
