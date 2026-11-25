import { Form, Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { update as acceptRoute } from '@/routes/editor-invitations';

type PageProps = {
    invitation: { id: string; email: string; expires_at: string } | null;
    consent: { title: string; body: string; checkbox: string } | null;
};

export default function EditorInvitation({ invitation, consent }: PageProps) {
    if (invitation === null || consent === null) {
        return (
            <>
                <Head title="Invitation" />
                <div className="mx-auto grid max-w-prose gap-3 p-gutter py-10">
                    <h1 className="text-h1">
                        This invitation is no longer valid
                    </h1>
                    <p className="text-body text-muted-foreground">
                        The link may have expired, been replaced, or belong to a
                        different account. Ask the person who invited you to
                        send a new one.
                    </p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Blog editor invitation" />
            <div className="mx-auto grid max-w-prose gap-6 p-gutter py-10">
                <header>
                    <h1 className="text-h1">Write for the blog</h1>
                    <p className="mt-0.5 text-body text-muted-foreground">
                        You have been invited to write and publish your own
                        articles. Editors can only see the blog screens.
                    </p>
                </header>

                <Form
                    action={acceptRoute({ invitation: invitation.id }).url}
                    method="put"
                    className="panel grid gap-4 p-4 md:p-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <h2 className="text-h3">{consent.title}</h2>
                            <p className="text-body-sm">{consent.body}</p>
                            <label className="flex items-start gap-2 text-body">
                                <input
                                    type="checkbox"
                                    name="consent"
                                    value="1"
                                    className="mt-1 size-5"
                                />
                                <span>{consent.checkbox}</span>
                            </label>
                            {(errors.consent || errors.invitation) && (
                                <p
                                    role="alert"
                                    className="font-bold text-danger-text"
                                >
                                    {errors.consent ?? errors.invitation}
                                </p>
                            )}
                            <Button type="submit" loading={processing}>
                                Accept invitation
                            </Button>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
