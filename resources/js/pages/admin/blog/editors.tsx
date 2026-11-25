import { Form, Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ConfirmActionButton } from '@/components/blog/confirm-action-button';
import AdminLayout from '@/layouts/admin-layout';
import { destroy as removeEditor } from '@/routes/admin/blog/editors';
import {
    destroy as revokeInvitation,
    store as inviteEditor,
} from '@/routes/admin/blog/editor-invitations';
import { store as resendInvitation } from '@/routes/admin/blog/editor-invitations/resend';

type Editor = {
    id: string;
    name: string;
    email: string;
    posts_count: number;
};
type Invitation = {
    id: string;
    email: string;
    invited_by: string | null;
    invited_at: string | null;
    expires_at: string;
    expired: boolean;
};

const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : '';

export default function BlogEditors({
    editors,
    invitations,
    max_pending,
}: {
    editors: Editor[];
    invitations: Invitation[];
    max_pending: number;
}) {
    return (
        <AdminLayout>
            <Head title="Blog editors" />
            <div className="mx-auto grid max-w-container gap-6 p-gutter py-8">
                <h1 className="text-h1">Blog editors</h1>

                <section className="panel grid gap-3 p-4 md:p-6">
                    <h2 className="text-h3">Invite an editor</h2>
                    <p className="text-body-sm text-muted-foreground">
                        Editors write and publish their own posts and see
                        nothing else in the admin area. Up to {max_pending}{' '}
                        invitations can be pending at once.
                    </p>
                    <Form
                        action={inviteEditor().url}
                        method="post"
                        resetOnSuccess
                        options={{ preserveScroll: true }}
                        className="flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                        {({ errors, processing }) => (
                            <>
                                <FormField
                                    label="Email"
                                    required
                                    error={errors.email}
                                    className="flex-1"
                                >
                                    <Input name="email" type="email" />
                                </FormField>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    className="sm:mt-7"
                                >
                                    Send invitation
                                </Button>
                            </>
                        )}
                    </Form>
                </section>

                <section className="grid gap-3">
                    <h2 className="text-h3">Pending invitations</h2>
                    {invitations.length === 0 ? (
                        <p className="text-body text-muted-foreground">
                            No open invitations.
                        </p>
                    ) : (
                        <ul className="grid gap-2">
                            {invitations.map((invitation) => (
                                <li
                                    key={invitation.id}
                                    className="panel flex flex-wrap items-center gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-label font-bold">
                                            {invitation.email}
                                        </p>
                                        <p className="text-body-sm text-muted-foreground">
                                            Invited by{' '}
                                            {invitation.invited_by ??
                                                'an admin'}{' '}
                                            on {date(invitation.invited_at)}
                                            {' · '}
                                            {invitation.expired
                                                ? 'expired'
                                                : `expires ${date(invitation.expires_at)}`}
                                        </p>
                                    </div>
                                    {invitation.expired && (
                                        <Badge variant="warning">expired</Badge>
                                    )}
                                    <ConfirmActionButton
                                        label="Resend"
                                        method="post"
                                        variant="neutral"
                                        url={
                                            resendInvitation({
                                                invitation: invitation.id,
                                            }).url
                                        }
                                        title="Resend invitation"
                                        text={`Send ${invitation.email} the invitation link again and restart its expiry?`}
                                    />
                                    <ConfirmActionButton
                                        label="Revoke"
                                        url={
                                            revokeInvitation({
                                                invitation: invitation.id,
                                            }).url
                                        }
                                        title="Revoke invitation"
                                        text={`The link sent to ${invitation.email} will stop working.`}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="grid gap-3">
                    <h2 className="text-h3">Active editors</h2>
                    {editors.length === 0 ? (
                        <p className="text-body text-muted-foreground">
                            No editors yet.
                        </p>
                    ) : (
                        <ul className="grid gap-2">
                            {editors.map((editor) => (
                                <li
                                    key={editor.id}
                                    className="panel flex flex-wrap items-center gap-3 px-4 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-label font-bold">
                                            {editor.name}
                                        </p>
                                        <p className="text-body-sm text-muted-foreground">
                                            {editor.email} ·{' '}
                                            {editor.posts_count} posts
                                        </p>
                                    </div>
                                    <ConfirmActionButton
                                        label="Remove"
                                        url={
                                            removeEditor({ editor: editor.id })
                                                .url
                                        }
                                        title="Remove editor"
                                        text={`${editor.name} goes back to a regular account and their author profile is deactivated. Their posts stay online under their name until you reassign them.`}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
