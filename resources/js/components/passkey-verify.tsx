import type { UrlMethodPair } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    routes?: {
        options: UrlMethodPair;
        submit: UrlMethodPair;
    };
    label?: string;
    loadingLabel?: string;
    separator?: string;
};

export default function PasskeyVerify({
    routes,
    label,
    loadingLabel,
    separator,
}: Props = {}) {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        ...(routes && {
            routes: {
                options: routes.options.url,
                submit: routes.submit.url,
            },
        }),
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <div className="grid gap-4">
            <Button
                variant="outline"
                block
                onClick={verify}
                loading={isLoading}
            >
                {isLoading ? (
                    <Spinner aria-hidden="true" />
                ) : (
                    <KeyRound aria-hidden="true" />
                )}
                {isLoading
                    ? (loadingLabel ?? 'Authenticating...')
                    : (label ?? 'Sign in with a passkey')}
            </Button>
            <InputError message={error ?? undefined} className="text-center" />
            <div className="relative" aria-hidden="true">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <p className="relative flex justify-center text-caption uppercase">
                    <span className="bg-surface px-2 text-muted-foreground">
                        {separator ?? 'Or continue with email'}
                    </span>
                </p>
            </div>
        </div>
    );
}
