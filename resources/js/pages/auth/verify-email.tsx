import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />
            <div className="grid gap-6">
                {status === 'verification-link-sent' && (
                    <Banner tone="success" live>
                        A new verification link has been sent to the email
                        address you provided during registration.
                    </Banner>
                )}

                <Form {...send.form()} className="grid gap-4 text-center">
                    {({ processing }) => (
                        <>
                            <Button
                                variant="secondary"
                                block
                                loading={processing}
                            >
                                Resend verification email
                            </Button>
                            <TextLink href={logout()} className="mx-auto">
                                Log out
                            </TextLink>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
