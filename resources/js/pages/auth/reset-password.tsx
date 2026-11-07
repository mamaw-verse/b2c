import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    return (
        <>
            <Head title="Reset password" />
            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-5">
                        <FormField
                            id="email"
                            label="Email"
                            error={errors.email}
                        >
                            <Input
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                readOnly
                            />
                        </FormField>

                        <FormField
                            id="password"
                            label="Password"
                            required
                            error={errors.password}
                        >
                            <PasswordInput
                                name="password"
                                autoComplete="new-password"
                                autoFocus
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
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Confirm password"
                                passwordrules={passwordRules}
                            />
                        </FormField>

                        <Button
                            type="submit"
                            size="lg"
                            block
                            loading={processing}
                            data-test="reset-password-button"
                        >
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Please enter your new password below',
};
