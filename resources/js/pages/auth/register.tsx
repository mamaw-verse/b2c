import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Invitation = {
    id: string;
    shop_name: string;
    email: string;
};

type Props = {
    passwordRules: string;
    invitation?: Invitation | null;
    email?: string | null;
};

export default function Register({ passwordRules, invitation, email }: Props) {
    return (
        <>
            <Head title="Register" />

            {invitation && (
                <div className="mb-6">
                    <Banner
                        tone="info"
                        title={`Staff invitation from ${invitation.shop_name}`}
                    >
                        Complete your registration to automatically join the{' '}
                        <strong>{invitation.shop_name}</strong> team.
                    </Banner>
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        {invitation && (
                            <input
                                type="hidden"
                                name="invitation"
                                value={invitation.id}
                            />
                        )}

                        <FormField
                            id="name"
                            label="Name"
                            required
                            error={errors.name}
                        >
                            <Input
                                type="text"
                                autoFocus
                                tabIndex={1}
                                autoComplete="name"
                                name="name"
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
                                tabIndex={2}
                                autoComplete="email"
                                name="email"
                                defaultValue={invitation?.email ?? email ?? ''}
                                readOnly={Boolean(invitation)}
                                placeholder="email@example.com"
                            />
                        </FormField>

                        <FormField
                            id="password"
                            label="Password"
                            required
                            error={errors.password}
                        >
                            <PasswordInput
                                tabIndex={3}
                                autoComplete="new-password"
                                name="password"
                                placeholder="Password"
                                passwordrules={passwordRules}
                            />
                        </FormField>

                        <FormField
                            id="password_confirmation"
                            label="Confirm password"
                            required
                            error={errors.password_confirmation}
                        >
                            <PasswordInput
                                tabIndex={4}
                                autoComplete="new-password"
                                name="password_confirmation"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                        </FormField>

                        <Button
                            type="submit"
                            size="lg"
                            block
                            tabIndex={5}
                            loading={processing}
                            data-test="register-user-button"
                        >
                            Create account
                        </Button>
                    </div>
                )}
            </Form>

            <p className="mt-6 text-center text-body-sm text-muted-foreground">
                Already have an account?{' '}
                <TextLink href={login()} tabIndex={6}>
                    Log in
                </TextLink>
            </p>
        </>
    );
}

Register.layout = {
    title: 'Create an account',
    description: 'Enter your details below to create your account',
};
