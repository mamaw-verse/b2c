import { Form, Head, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState(false);
    const [code, setCode] = useState('');

    const authConfigContent = useMemo(
        () =>
            showRecoveryInput
                ? {
                      title: 'Recovery code',
                      description:
                          'Please confirm access to your account by entering one of your emergency recovery codes.',
                      toggleText: 'login using an authentication code',
                  }
                : {
                      title: 'Authentication code',
                      description:
                          'Enter the authentication code provided by your authenticator application.',
                      toggleText: 'login using a recovery code',
                  },
        [showRecoveryInput],
    );

    setLayoutProps(authConfigContent);

    return (
        <>
            <Head title="Two-factor authentication" />
            <Form
                {...store.form()}
                className="grid gap-5"
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <FormField
                                id="recovery_code"
                                label="Recovery code"
                                required
                                error={errors.recovery_code}
                            >
                                <Input
                                    name="recovery_code"
                                    type="text"
                                    placeholder="Enter recovery code"
                                    autoFocus
                                />
                            </FormField>
                        ) : (
                            <fieldset className="grid justify-items-center gap-3">
                                <legend className="sr-only">
                                    Authentication code
                                </legend>
                                <InputOTP
                                    name="code"
                                    maxLength={OTP_MAX_LENGTH}
                                    value={code}
                                    onChange={setCode}
                                    disabled={processing}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    autoFocus
                                    aria-describedby={
                                        errors.code ? 'code-error' : undefined
                                    }
                                    aria-invalid={Boolean(errors.code)}
                                >
                                    <InputOTPGroup>
                                        {Array.from(
                                            { length: OTP_MAX_LENGTH },
                                            (_, index) => (
                                                <InputOTPSlot
                                                    key={index}
                                                    index={index}
                                                />
                                            ),
                                        )}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError
                                    id="code-error"
                                    message={errors.code}
                                />
                            </fieldset>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            block
                            loading={processing}
                        >
                            Continue
                        </Button>

                        <p className="text-center text-body-sm text-muted-foreground">
                            or you can{' '}
                            <button
                                type="button"
                                className="font-bold text-primary underline decoration-1 underline-offset-2"
                                onClick={() => {
                                    setShowRecoveryInput(!showRecoveryInput);
                                    clearErrors();
                                    setCode('');
                                }}
                            >
                                {authConfigContent.toggleText}
                            </button>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}
