import {
    Banknote,
    Building2,
    CircleAlert,
    CreditCard,
    Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethodItem = {
    id: string;
    label: string;
    desc: string;
    icon?: string;
    fee?: number;
};

type PaymentMethodPickerProps = {
    methods: PaymentMethodItem[];
    value?: string | null;
    onChange?: (id: string) => void;
    error?: string;
    required?: boolean;
    name?: string;
    className?: string;
};

function getMethodIcon(id: string) {
    switch (id) {
        case 'cod':
            return Banknote;
        case 'ewallet':
            return Smartphone;
        case 'card':
            return CreditCard;
        case 'banking':
            return Building2;
        default:
            return CreditCard;
    }
}

export function PaymentMethodPicker({
    methods,
    value,
    onChange,
    error,
    required = true,
    name = 'payment_method',
    className,
}: PaymentMethodPickerProps) {
    return (
        <fieldset className={cn('grid gap-2', className)}>
            <legend className="mb-1 text-label text-foreground">
                Payment method
                {required && (
                    <span className="text-danger" aria-hidden="true">
                        {' '}
                        *
                    </span>
                )}
            </legend>
            <div className="grid gap-2">
                {methods.map((method) => {
                    const isChecked = value === method.id;
                    const Icon = getMethodIcon(method.id);

                    return (
                        <label
                            key={method.id}
                            htmlFor={`pm-${method.id}`}
                            className={cn(
                                'flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border bg-surface p-3 select-none',
                                isChecked
                                    ? 'border-primary bg-primary-soft'
                                    : 'border-border hover:bg-surface-subtle',
                                'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                            )}
                        >
                            <input
                                type="radio"
                                id={`pm-${method.id}`}
                                name={name}
                                className="size-5 shrink-0 accent-primary"
                                checked={isChecked}
                                onChange={() => onChange?.(method.id)}
                            />

                            <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground">
                                <Icon aria-hidden="true" className="size-5" />
                            </span>

                            <span className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                                <span className="text-label">
                                    {method.label}
                                </span>
                                <span className="text-body-sm text-muted-foreground">
                                    {method.desc}
                                </span>
                            </span>
                        </label>
                    );
                })}
            </div>

            {error && (
                <p className="flex items-start gap-1 text-body-sm font-bold text-danger">
                    <CircleAlert className="mt-px size-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </fieldset>
    );
}
