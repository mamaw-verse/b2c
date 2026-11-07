import { Form, Head } from '@inertiajs/react';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { store } from '@/routes/password/confirm';
import {
    index as confirmOptions,
    store as confirmStore,
} from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyConfirmationController';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Confirm password" />
            <div className="grid gap-6">
                <PasskeyVerify
                    routes={{
                        options: confirmOptions(),
                        submit: confirmStore(),
                    }}
                    label="Confirm with passkey"
                    loadingLabel="Confirming..."
                    separator="Or confirm with password"
                />

                <Form {...store.form()} resetOnSuccess={['password']}>
                    {({ processing, errors }) => (
                        <div className="grid gap-5">
                            <FormField
                                id="password"
                                label="Password"
                                required
                                error={errors.password}
                            >
                                <PasswordInput
                                    name="password"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                            </FormField>

                            <Button
                                type="submit"
                                size="lg"
                                block
                                loading={processing}
                                data-test="confirm-password-button"
                            >
                                Confirm password
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Confirm password',
    description:
        'This is a secure area of the application. Please confirm your password before continuing.',
};
