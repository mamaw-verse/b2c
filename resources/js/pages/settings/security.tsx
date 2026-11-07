import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />
            <h1 className="sr-only">Security settings</h1>

            <section className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <Form
                    {...SecurityController.update.form()}
                    options={{ preserveScroll: true }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }
                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="grid gap-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <FormField
                                id="current_password"
                                label="Current password"
                                required
                                error={errors.current_password}
                            >
                                <PasswordInput
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                />
                            </FormField>

                            <FormField
                                id="password"
                                label="New password"
                                required
                                error={errors.password}
                            >
                                <PasswordInput
                                    ref={passwordInput}
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    passwordrules={props.passwordRules}
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
                                    passwordrules={props.passwordRules}
                                />
                            </FormField>

                            <div>
                                <Button
                                    type="submit"
                                    loading={processing}
                                    data-test="update-password-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>

            <ManageTwoFactor
                canManageTwoFactor={props.canManageTwoFactor}
                requiresConfirmation={props.requiresConfirmation}
                twoFactorEnabled={props.twoFactorEnabled}
            />
            <ManagePasskeys
                canManagePasskeys={props.canManagePasskeys}
                passkeys={props.passkeys}
            />
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
