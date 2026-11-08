import { CircleAlert, Snowflake, Truck, Zap } from 'lucide-react';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export type ShippingOptionItem = {
    id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    fee: number;
    eta?: string | null;
    is_cold_chain?: boolean;
    unavailableReason?: string | null;
};

type ShippingOptionPickerProps = {
    options: ShippingOptionItem[];
    value?: string | null;
    onChange?: (id: string) => void;
    name?: string;
    error?: string;
    className?: string;
};

export function ShippingOptionPicker({
    options,
    value,
    onChange,
    name = 'shipping_option',
    error,
    className,
}: ShippingOptionPickerProps) {
    return (
        <fieldset className={cn('grid gap-2', className)}>
            <legend className="mb-1 text-label text-foreground">
                Shipping option
            </legend>
            <div className="grid gap-2">
                {options.map((opt) => {
                    const isChecked = value === opt.id;
                    const isDisabled = Boolean(opt.unavailableReason);
                    const feeDisplay =
                        opt.fee === 0 ? 'FREE' : formatPeso(opt.fee);

                    return (
                        <label
                            key={opt.id}
                            htmlFor={`shipping-${opt.id}`}
                            className={cn(
                                'flex min-h-touch-primary cursor-pointer items-center gap-3 rounded-card border bg-surface p-3 select-none',
                                isChecked
                                    ? 'border-primary bg-primary-soft'
                                    : 'border-border hover:bg-surface-subtle',
                                isDisabled &&
                                    'cursor-not-allowed bg-surface-subtle opacity-70',
                                'focus-ring',
                            )}
                        >
                            <input
                                type="radio"
                                id={`shipping-${opt.id}`}
                                name={name}
                                className="size-5 shrink-0 accent-primary"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={() => onChange?.(opt.id)}
                            />

                            <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-surface-muted text-foreground">
                                {opt.is_cold_chain ? (
                                    <Snowflake
                                        aria-hidden="true"
                                        className="size-5 text-info-text"
                                    />
                                ) : opt.name
                                      .toLowerCase()
                                      .includes('express') ? (
                                    <Zap
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                ) : (
                                    <Truck
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                )}
                            </span>

                            <span className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                                <span className="flex items-center gap-1.5 text-label">
                                    {opt.name}
                                    {opt.is_cold_chain && (
                                        <span className="badge badge-info text-caption">
                                            Cold-chain
                                        </span>
                                    )}
                                </span>
                                <span className="text-body-sm text-muted-foreground">
                                    {isDisabled
                                        ? opt.unavailableReason
                                        : opt.eta
                                          ? `Get by ${opt.eta}`
                                          : opt.description}
                                </span>
                            </span>

                            <span className="tabular text-label">
                                {feeDisplay}
                            </span>
                        </label>
                    );
                })}
            </div>

            {error && (
                <p className="flex items-start gap-1 text-body-sm font-bold text-danger-text">
                    <CircleAlert className="mt-px size-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </fieldset>
    );
}
