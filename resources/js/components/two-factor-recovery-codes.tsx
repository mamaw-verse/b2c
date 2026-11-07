import { Form } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { regenerateRecoveryCodes } from '@/routes/two-factor';

type Props = {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
}: Props) {
    const [codesAreVisible, setCodesAreVisible] = useState(false);
    const codesSectionRef = useRef<HTMLDivElement | null>(null);
    const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;

    const toggleCodesVisibility = useCallback(async () => {
        if (!codesAreVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setCodesAreVisible(!codesAreVisible);

        if (!codesAreVisible) {
            setTimeout(() => {
                codesSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
        }
    }, [codesAreVisible, recoveryCodesList.length, fetchRecoveryCodes]);

    useEffect(() => {
        if (!recoveryCodesList.length) {
            void fetchRecoveryCodes();
        }
    }, [recoveryCodesList.length, fetchRecoveryCodes]);

    const Icon = codesAreVisible ? EyeOff : Eye;

    return (
        <Card className="gap-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LockKeyhole className="size-4" aria-hidden="true" />
                    2FA recovery codes
                </CardTitle>
                <CardDescription>
                    Recovery codes let you regain access if you lose your 2FA
                    device. Store them in a secure password manager.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={toggleCodesVisibility}
                        aria-expanded={codesAreVisible}
                        aria-controls="recovery-codes-section"
                    >
                        <Icon className="size-4" aria-hidden="true" />
                        {codesAreVisible ? 'Hide' : 'View'} recovery codes
                    </Button>

                    {canRegenerateCodes && (
                        <Form
                            {...regenerateRecoveryCodes.form()}
                            options={{ preserveScroll: true }}
                            onSuccess={fetchRecoveryCodes}
                        >
                            {({ processing }) => (
                                <Button
                                    variant="secondary"
                                    type="submit"
                                    loading={processing}
                                    aria-describedby="regenerate-warning"
                                >
                                    <RefreshCw aria-hidden="true" />
                                    Regenerate codes
                                </Button>
                            )}
                        </Form>
                    )}
                </div>

                <div
                    id="recovery-codes-section"
                    hidden={!codesAreVisible}
                    className="grid gap-3"
                >
                    {errors?.length ? (
                        <AlertError errors={errors} />
                    ) : (
                        <>
                            <div
                                ref={codesSectionRef}
                                className="grid gap-1 rounded-panel bg-surface-muted p-4 font-mono text-body-sm"
                                role="list"
                                aria-label="Recovery codes"
                            >
                                {recoveryCodesList.length ? (
                                    recoveryCodesList.map((code) => (
                                        <div key={code} role="listitem">
                                            {code}
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="grid gap-2"
                                        aria-label="Loading recovery codes"
                                    >
                                        {Array.from({ length: 8 }, (_, i) => (
                                            <Skeleton key={i} className="h-4" />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p
                                id="regenerate-warning"
                                className="text-caption text-muted-foreground"
                            >
                                Each recovery code can be used once and is
                                removed after use.
                            </p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
