import { Form, Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot password" />
            <div className="grid gap-6">
                {status && (
                    <Banner tone="success" live>
                        {status}
                    </Banner>
                )}

                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <div className="grid gap-5">
                            <FormField
                                id="email"
                                label="Email address"
                                required
                                error={errors.email}
                            >
                                <Input
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="email@example.com"
                                />
                            </FormField>

                            <Button
                                type="submit"
                                size="lg"
                                block
                                loading={processing}
                                data-test="email-password-reset-link-button"
                            >
                                Email password reset link
                            </Button>
                        </div>
                    )}
                </Form>

                <p className="text-center text-body-sm text-muted-foreground">
                    Or, return to <TextLink href={login()}>log in</TextLink>
                </p>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
