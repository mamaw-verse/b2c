import { CircleAlert } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type PhoneInputProps = {
    id?: string;
    name?: string;
    label?: string;
    value?: string;
    onChange?: (val: string) => void;
    error?: string;
    required?: boolean;
    help?: string;
    disabled?: boolean;
    className?: string;
};

/** Formats a string of digits into '9XX XXX XXXX' display */
function formatPhoneDigits(digits: string): string {
    const clean = digits.replace(/\D/g, '');
    let local = clean;
    if (local.startsWith('63')) {
        local = local.slice(2);
    } else if (local.startsWith('0')) {
        local = local.slice(1);
    }
    local = local.slice(0, 10);

    const parts: string[] = [];
    if (local.length > 0) parts.push(local.slice(0, 3));
    if (local.length > 3) parts.push(local.slice(3, 6));
    if (local.length > 6) parts.push(local.slice(6, 10));

    return parts.join(' ');
}

/** Converts formatted local '9XX XXX XXXX' or raw digits to E.164 '+639XXXXXXXXX' */
function toE164(display: string): string {
    const clean = display.replace(/\D/g, '');
    if (!clean) return '';
    return `+63${clean}`;
}

export function PhoneInput({
    id: explicitId,
    name,
    label = 'Mobile number',
    value = '',
    onChange,
    error,
    required = false,
    help,
    disabled = false,
    className,
}: PhoneInputProps) {
    const generatedId = useId();
    const id = explicitId ?? generatedId;
    const helpId = `${id}-help`;
    const errorId = `${id}-error`;

    // Extract digits for display
    const displayValue = formatPhoneDigits(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const formatted = formatPhoneDigits(raw);
        const e164 = toE164(formatted);
        onChange?.(e164);
    };

    return (
        <div className={cn('grid gap-1.5', className)}>
            {label && (
                <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor={id} className="text-label text-foreground">
                        {label}
                        {required && (
                            <span className="text-danger-text" aria-hidden="true">
                                {' '}
                                *
                            </span>
                        )}
                    </label>
                </div>
            )}
            <label
                htmlFor={id}
                className={cn(
                    'field focus-ring flex cursor-text items-stretch overflow-hidden p-0',
                    error && 'border-danger',
                    disabled && 'cursor-not-allowed bg-surface-muted',
                )}
            >
                <span
                    className="inline-flex items-center gap-1 border-r border-border-control bg-surface-muted px-3 text-input text-foreground select-none"
                    aria-hidden="true"
                >
                    +63
                </span>
                <input
                    id={id}
                    name={name}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="9XX XXX XXXX"
                    maxLength={12}
                    value={displayValue}
                    disabled={disabled}
                    required={required}
                    onChange={handleChange}
                    aria-describedby={cn(help && helpId, error && errorId)}
                    aria-invalid={Boolean(error)}
                    className="min-w-0 flex-1 bg-transparent px-3 text-input text-foreground placeholder:text-subtle-foreground disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground"
                />
            </label>

            {help && (
                <div className="flex gap-2">
                    <p
                        id={helpId}
                        className="text-body-sm text-muted-foreground"
                    >
                        {help}
                    </p>
                </div>
            )}

            {error && (
                <p
                    id={errorId}
                    className="flex items-start gap-1 text-body-sm font-bold text-danger-text"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-px size-4 shrink-0"
                    />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}
