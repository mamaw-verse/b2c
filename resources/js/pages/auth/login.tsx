import { Form, Head, usePage } from "@inertiajs/react";
import PasskeyVerify from "@/components/passkey-verify";
import PasswordInput from "@/components/password-input";
import TextLink from "@/components/text-link";
import GoogleAuthButton from "@/components/google-auth-button";
import TurnstileField from "@/components/turnstile-field";
import { Banner } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { resetTurnstile } from "@/lib/turnstile";
import { register } from "@/routes";
import { store } from "@/routes/login";
import { request } from "@/routes/password";

type Props = {
    status?: string;
    canResetPassword: boolean;
    email?: string;
};

export default function Login({ status, canResetPassword, email }: Props) {
    const googleError = (usePage().props.errors as Record<string, string>)
        ?.google;

    return (
        <>
            <Head title="Log in" />
            <div className="grid gap-6">
                <PasskeyVerify />

                <Form
                    {...store.form()}
                    resetOnSuccess={["password"]}
                    onFinish={resetTurnstile}
                >
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
                                    autoFocus={!email}
                                    tabIndex={1}
                                    autoComplete="email"
                                    defaultValue={email ?? ""}
                                    placeholder="email@example.com"
                                />
                            </FormField>

                            <FormField
                                id="password"
                                label="Password"
                                required
                                error={errors.password}
                                labelAction={
                                    canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-body-sm"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )
                                }
                            >
                                <PasswordInput
                                    name="password"
                                    tabIndex={2}
                                    autoFocus={Boolean(email)}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                            </FormField>

                            <label
                                htmlFor="remember"
                                className="flex min-h-touch items-center gap-3"
                            >
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <span className="text-body">Remember me</span>
                            </label>

                            <TurnstileField
                                error={errors["cf-turnstile-response"]}
                            />

                            <Button
                                type="submit"
                                size="lg"
                                block
                                tabIndex={4}
                                loading={processing}
                                data-test="login-button"
                            >
                                Log in
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="relative" aria-hidden="true">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <p className="relative flex justify-center text-caption uppercase">
                        <span className="bg-surface px-2 text-muted-foreground">
                            Or
                        </span>
                    </p>
                </div>
                <GoogleAuthButton />
                {googleError && (
                    <Banner tone="danger" live>
                        {googleError}
                    </Banner>
                )}

                <p className="text-center text-body-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <TextLink href={register()} tabIndex={5}>
                        Sign up
                    </TextLink>
                </p>

                {status && (
                    <Banner tone="success" live>
                        {status}
                    </Banner>
                )}
            </div>
        </>
    );
}

Login.layout = {
    title: "Log in to your account",
    description: "Enter your email and password below to log in",
};
