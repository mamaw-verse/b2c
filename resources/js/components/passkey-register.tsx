import { usePasskeyRegister } from '@laravel/passkeys/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;
        const browser = [
            { pattern: /Edg|Edge/, name: 'Edge' },
            { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
            { pattern: /Firefox|FxiOS/, name: 'Firefox' },
            { pattern: /Chrome|CriOS/, name: 'Chrome' },
            { pattern: /Safari/, name: 'Safari' },
        ].find(({ pattern }) => pattern.test(ua))?.name;
        const os = [
            { pattern: /iPhone/, name: 'iPhone' },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
            { pattern: /Android/, name: 'Android' },
            { pattern: /Mac/, name: 'Mac' },
            { pattern: /Windows/, name: 'Windows' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(' on ') || '';
    });
    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    if (!isSupported) {
        return (
            <p className="text-body-sm text-muted-foreground">
                Passkeys are not supported in this browser.
            </p>
        );
    }

    if (!showForm) {
        return (
            <Button variant="outline" onClick={() => setShowForm(true)}>
                Add passkey
            </Button>
        );
    }

    return (
        <form
            onSubmit={async (event) => {
                event.preventDefault();
                if (name.trim()) {
                    await register(name);
                }
            }}
            className="panel grid gap-4 p-4"
        >
            <FormField
                id="passkey-name"
                label="Passkey name"
                required
                help="A name helps you identify this passkey later."
            >
                <Input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g., MacBook Pro, iPhone"
                    autoFocus
                />
            </FormField>
            <InputError message={error ?? undefined} />
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!name.trim()}
                >
                    Register passkey
                </Button>
                <Button
                    type="button"
                    variant="neutral"
                    onClick={() => {
                        setShowForm(false);
                        setName('');
                    }}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
