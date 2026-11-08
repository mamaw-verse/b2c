import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />
            <h1 className="sr-only">Profile settings</h1>

            <section className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{ preserveScroll: true }}
                    className="grid gap-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <FormField
                                id="name"
                                label="Name"
                                required
                                error={errors.name}
                            >
                                <Input
                                    defaultValue={auth.user.name}
                                    name="name"
                                    autoComplete="name"
                                    placeholder="Full name"
                                />
                            </FormField>

                            <FormField
                                id="email"
                                label="Email address"
                                required
                                error={errors.email}
                            >
                                <Input
                                    type="email"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    autoComplete="username"
                                    placeholder="Email address"
                                />
                            </FormField>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <Banner
                                        tone="warning"
                                        title="Email unverified"
                                    >
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="font-bold text-primary-text underline underline-offset-2"
                                        >
                                            Re-send the verification email
                                        </Link>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-2 text-body-sm font-bold text-success-text">
                                                A new verification link has been
                                                sent.
                                            </p>
                                        )}
                                    </Banner>
                                )}

                            <div>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
